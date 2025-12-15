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

const loadVoices = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const availableVoices = window.speechSynthesis.getVoices();
    if (availableVoices.length > 0) {
        voices = availableVoices;
        logger.log("Speech synthesis voices loaded.", voices.map(v => `${v.name} (${v.lang})`));
    }
};

// Load voices initially and on change
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
}

/**
 * Speaks text using the browser's built-in Web Speech API.
 * This works offline and is more reliable than external APIs.
 * @param text The text to speak.
 * @param lang The language ('vi' for Vietnamese, 'en' for English).
 */
export const speakText = (text: string, lang: 'vi' | 'en' = 'en') => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      logger.warn("Speech Synthesis not supported.");
      return;
  }

  try {
      const utterance = new SpeechSynthesisUtterance(text);
      const langCode = lang === 'vi' ? 'vi-VN' : 'en-US';
      utterance.lang = langCode;
      utterance.rate = 0.9;

      window.speechSynthesis.cancel(); // Stop any currently playing speech

      // Find a voice that matches the language code (e.g., 'en-US') or the base language (e.g., 'en')
      const desiredVoice = voices.find(voice => voice.lang === langCode) || voices.find(voice => voice.lang.startsWith(lang));
      
      if (desiredVoice) {
          utterance.voice = desiredVoice;
          logger.log(`Using voice: ${desiredVoice.name} (${desiredVoice.lang}) for speech.`);
      } else {
          logger.warn(`No specific voice found for language: ${lang}. Using browser default.`);
      }
      
      window.speechSynthesis.speak(utterance);
      logger.log(`Requested speech for: "${text}"`);
  } catch (e) {
      logger.error("Speech synthesis failed.", e);
  }
};


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