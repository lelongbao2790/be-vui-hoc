import { logger } from "./logger";

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window !== 'undefined') {
    if (!audioContext) {
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        logger.error("Web Audio API is not supported in this browser", e);
        return null;
      }
    }
    return audioContext;
  }
  return null;
};

const playSound = (type: 'sine' | 'square' | 'sawtooth' | 'triangle', frequency: number, duration: number) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  
  gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
};

export const playCorrectSound = () => {
  logger.log('Playing correct sound');
  playSound('sine', 600, 0.2);
  setTimeout(() => playSound('sine', 800, 0.2), 100);
};

export const playIncorrectSound = () => {
  logger.log('Playing incorrect sound');
  playSound('square', 200, 0.3);
};

// --- Speech Synthesis Logic using the browser's Web Speech API ---

let voices: SpeechSynthesisVoice[] = [];
let voicesReady = false;
const voiceWaiters: Array<(v: SpeechSynthesisVoice[]) => void> = [];

const loadVoices = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const availableVoices = window.speechSynthesis.getVoices() || [];
  if (availableVoices.length > 0) {
    voices = availableVoices;
    voicesReady = true;
    logger.log('Speech synthesis voices loaded.', voices.map(v => `${v.name} (${v.lang})`));
    // notify waiters
    while (voiceWaiters.length) voiceWaiters.shift()!(voices);
  }
};

// Load voices initially and on change
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

const waitForVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    if (voicesReady) return resolve(voices);
    voiceWaiters.push(resolve);
    // safety timeout: resolve with whatever is available after 2s
    setTimeout(() => resolve(window.speechSynthesis.getVoices() || []), 2000);
  });
};

/**
 * Pick the best voice for the requested language, preferring local/system voices.
 */
const pickVoiceForLang = (availableVoices: SpeechSynthesisVoice[], lang: 'vi' | 'en') => {
  const target = lang === 'vi' ? 'vi' : 'en';
  const lowerTarget = target.toLowerCase();

  // Exact language code match first (e.g., 'vi-VN' or 'en-US')
  let candidates = availableVoices.filter(v => (v.lang || '').toLowerCase() === (lang === 'vi' ? 'vi-vn' : 'en-us'));
  if (candidates.length === 0) {
    // startsWith match (e.g., 'vi', 'vi-VN', 'en')
    candidates = availableVoices.filter(v => (v.lang || '').toLowerCase().startsWith(lowerTarget));
  }
  if (candidates.length === 0 && lang === 'vi') {
    // name hints (some browsers use names, e.g., 'Google Việt Nam')
    candidates = availableVoices.filter(v => /viet|vietnam/i.test(v.name || ''));
  }
  if (candidates.length === 0) {
    // as last resort, pick default or any voice
    candidates = availableVoices;
  }

  // prefer localService > default > vendor-name hints
  const vendorHints = /(google|microsoft|amazon|siri|samantha|susan|amy|alloy|voice|british|uk|us)/i;
  candidates.sort((a, b) => {
    const score = (v: SpeechSynthesisVoice) => {
      let s = 0;
      if (v.localService) s += 4;
      if (v.default) s += 2;
      if (vendorHints.test(v.name || '')) s += 1;
      return s;
    };
    return score(b) - score(a);
  });

  return candidates[0];
};

/**
 * Speaks text using the browser's built-in Web Speech API.
 * This will prefer a Vietnamese system voice when lang='vi' and falls back gracefully.
 * @param text The text to speak.
 * @param lang The language ('vi' for Vietnamese, 'en' for English).
 * @param options Optional settings: rate, pitch, volume, preferredVoiceName.
 */
export const speakText = async (text: string, lang: 'vi' | 'en' = 'en', options?: { rate?: number; pitch?: number; volume?: number; preferredVoiceName?: string; persist?: boolean }) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    logger.warn('Speech Synthesis not supported.');
    return;
  }

  try {
    const availableVoices = await waitForVoices();

    const utterance = new SpeechSynthesisUtterance(text);
    const langCode = lang === 'vi' ? 'vi-VN' : 'en-US';
    utterance.lang = langCode;

    // tuned defaults: English should be normal speed and slightly stronger/pitched for clarity
    // Use normal speaking rate and a slightly higher pitch for better audibility and naturalness
    const defaultRate = lang === 'vi' ? 0.95 : 1.0;
    const defaultPitch = lang === 'vi' ? 1.0 : 1.1;
    const defaultVolume = 1.0;

    utterance.rate = options?.rate ?? defaultRate;
    utterance.pitch = options?.pitch ?? defaultPitch;
    // Type on SpeechSynthesisUtterance includes volume in libs; set defensively
    (utterance as any).volume = options?.volume ?? defaultVolume;

    window.speechSynthesis.cancel(); // Stop any currently playing speech

    let chosenVoice: SpeechSynthesisVoice | undefined;
    // Determine preferred voice (explicit option overrides saved preference)
    const preferredName = options?.preferredVoiceName ?? getPreferredVoiceName(lang);
    if (preferredName) {
      // try exact match, then case-insensitive, then substring
      chosenVoice = availableVoices.find(v => (v.name || '') === preferredName)
        || availableVoices.find(v => (v.name || '').toLowerCase() === preferredName.toLowerCase())
        || availableVoices.find(v => (v.name || '').toLowerCase().includes(preferredName.toLowerCase()));

      // if still not found, try to extract language code in parentheses e.g., (en-US)
      if (!chosenVoice) {
        const parenMatch = /\(([^)]+)\)$/.exec(preferredName);
        if (parenMatch) {
          const code = parenMatch[1];
          chosenVoice = availableVoices.find(v => (v.lang || '').toLowerCase() === code.toLowerCase());
        }
      }

      // persist if requested explicitly
      if (chosenVoice && options?.preferredVoiceName && options?.persist) {
        setPreferredVoiceName(lang, options.preferredVoiceName);
      }
    }

    if (!chosenVoice) {
      chosenVoice = pickVoiceForLang(availableVoices, lang);
    }

    if (chosenVoice) {
      utterance.voice = chosenVoice;
      logger.log(`Using voice: ${chosenVoice.name} (${chosenVoice.lang}) for ${lang} speech.`);
    } else {
      logger.warn(`No voices available; using browser default for ${lang}.`);
    }

    window.speechSynthesis.speak(utterance);
    logger.log(`Requested speech for: "${text}" (rate=${utterance.rate}, pitch=${utterance.pitch}, volume=${(utterance as any).volume})`);
  } catch (e) {
    logger.error('Speech synthesis failed.', e);
  }
};

/**
 * Utility to get list of available speech voices (may be empty until voices load).
 */
export const getAvailableVoices = (): SpeechSynthesisVoice[] => voices.slice();

/** Persist a user's preferred voice name for a given language (stored in localStorage) */
export const setPreferredVoiceName = (lang: 'vi' | 'en', name: string) => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(`preferredVoiceName.${lang}`, name);
    logger.log(`Saved preferred voice for ${lang}: ${name}`);
  } catch (e) {
    logger.warn('Failed to save preferred voice name to localStorage', e);
  }
};

export const getPreferredVoiceName = (lang: 'vi' | 'en'): string | undefined => {
  if (typeof window === 'undefined' || !window.localStorage) return undefined;
  try {
    return window.localStorage.getItem(`preferredVoiceName.${lang}`) ?? undefined;
  } catch (e) {
    logger.warn('Failed to read preferred voice name from localStorage', e);
    return undefined;
  }
};

// Auto-select Microsoft Aria (Natural) English voice as default if available and no user preference
const autoSelectMicrosoftAria = async () => {
  try {
    // Don't override an explicit user preference
    if (getPreferredVoiceName('en')) return;
    const voicesList = await waitForVoices();
    if (!voicesList || voicesList.length === 0) return;

    const desiredFullName = 'Microsoft Aria Online (Natural) - English (United States) (en-US)';
    let match = voicesList.find(v => (v.name || '') === desiredFullName);

    // Prefer voices that include both 'Aria' and 'Natural' (strong match), then 'Natural', then 'Aria'
    if (!match) {
      match = voicesList.find(v => /(aria).*natural|natural.*(aria)/i.test(v.name || '') && (v.lang || '').toLowerCase().startsWith('en'));
    }

    // Next prefer any voice with 'Natural' in the name and English language
    if (!match) {
      match = voicesList.find(v => /natural/i.test(v.name || '') && (v.lang || '').toLowerCase().startsWith('en'));
    }

    // Next prefer any voice with 'Aria' in the name and English language
    if (!match) {
      match = voicesList.find(v => /aria/i.test(v.name || '') && (v.lang || '').toLowerCase().startsWith('en'));
    }

    // Fallback to Microsoft voices in English
    if (!match) {
      match = voicesList.find(v => /microsoft/i.test(v.name || '') && (v.lang || '').toLowerCase().startsWith('en'));
    }

    if (match) {
      setPreferredVoiceName('en', match.name);
      logger.log(`Auto-selected preferred English voice: ${match.name}`);
    }
  } catch (e) {
    logger.warn('Auto-select Microsoft Aria voice failed', e);
  }
};

// Try auto-selection after we have voice list (non-blocking)
autoSelectMicrosoftAria();


// --- Pre-rendered Audio Logic for static phrases ---

// Non-verbal sound effects encoded in Base64
const SOUND_EFFECTS = {
    victory: [
      "data:audio/mpeg;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YV' IKlgkECBAcHCQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn+AgYKDhIeIjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1d...",
      "data:audio/wav;base64,UklGRigBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQBAAD//wIA/f8EAPz/BgD9/wYAAAAAAQAAAAIAAQABAAAAAQAAAAEAAQABAAEAAQABAAAAAQAAAAEAAQABAAEAAQAAAAEAAQAAAAEAAQAAAAIAAQAAAAEAAQABAAAAAQAAAAEAAQAAAAEAAQAAAAEAAQABAAAAAQABAAAAAAABAAYADgAjAD4ASABXAGIAeACDAGwAWgA8ACQA"
    ],
    encouragement: [
      "data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YRAAAAAAAAADDBccGhwcGiUfGhoZGRoaHR4eHw==",
      "data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YRAAAAAAABAQERkSExgZGxwcHB4fHh8fHw=="
    ]
};

const PRELOADED_SOUNDS: Record<string, Record<string, string[]>> = {
  vi: {
    victory: SOUND_EFFECTS.victory,
    encouragement: SOUND_EFFECTS.encouragement
  },
  en: {
    victory: SOUND_EFFECTS.victory,
    encouragement: SOUND_EFFECTS.encouragement
  }
};

let lastPhraseIndex = -1;

/**
 * Plays a preloaded audio sound from a Base64 string.
 * @param base64Sound The Base64 data URI of the sound.
 */
const playPreloadedSound = (base64Sound: string) => {
    try {
        const audio = new Audio(base64Sound);
        audio.play().catch(e => logger.error("Error playing audio:", e));
    } catch (e) {
        logger.error("Failed to create audio from Base64 source:", e);
    }
}

const playRandomPhrase = (phrases: string[]) => {
    if (phrases.length === 0) return;
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * phrases.length);
    } while (phrases.length > 1 && randomIndex === lastPhraseIndex);
    lastPhraseIndex = randomIndex;
    const sound = phrases[randomIndex];
    playPreloadedSound(sound);
};

export const playVictorySound = (lang: 'vi' | 'en') => {
  logger.log(`Playing victory sound for lang: ${lang}`);
  playCorrectSound();
  setTimeout(() => {
    const phrases = PRELOADED_SOUNDS[lang]?.victory || [];
    playRandomPhrase(phrases);
  }, 200);
};

export const playEncouragementSound = (lang: 'vi' | 'en') => {
  logger.log(`Playing encouragement sound for lang: ${lang}`);
  playIncorrectSound();
  setTimeout(() => {
    const phrases = PRELOADED_SOUNDS[lang]?.encouragement || [];
    playRandomPhrase(phrases);
  }, 200);
};