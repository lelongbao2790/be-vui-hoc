
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


// --- New Speech Synthesis Logic using the browser's Web Speech API ---

const VI_VICTORY_PHRASES = ["Bé giỏi lắm!", "Tuyệt vời!", "Xuất sắc!", "Con làm tốt lắm!", "Giỏi quá đi!"];
const VI_ENCOURAGEMENT_PHRASES = ["Không sao, cố gắng lên nào!", "Thử lại nhé!", "Gần đúng rồi, cố lên!", "Mình làm lại nha!"];

const EN_VICTORY_PHRASES = ["Great job!", "Awesome!", "Excellent!", "You're a star!", "Well done!"];
const EN_ENCOURAGEMENT_PHRASES = ["It's okay, try again!", "Let's give it another shot!", "You can do it!", "Keep trying!"];

let lastPhraseIndex = -1;
let voices: SpeechSynthesisVoice[] = [];

const loadVoices = () => {
    const availableVoices = window.speechSynthesis.getVoices();
    if (availableVoices.length > 0) {
        voices = availableVoices;
        logger.log("Speech synthesis voices loaded.", voices.map(v => v.name));
    }
};

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
}

/**
 * Speaks a given text using the Web Speech API.
 * @param text The text to speak.
 * @param lang The language ('vi' for Vietnamese, 'en' for English).
 */
export const speakText = (text: string, lang: 'vi' | 'en') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        logger.warn("Speech Synthesis not supported.");
        return;
    }

    logger.log(`Requesting speech for: "${text}" in lang: ${lang}`);
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const langCode = lang === 'vi' ? 'vi-VN' : 'en-US';
    utterance.lang = langCode;

    const desiredVoice = voices.find(voice => voice.lang === langCode) || voices.find(voice => voice.lang.startsWith(lang));
    
    if (desiredVoice) {
        utterance.voice = desiredVoice;
        logger.log(`Using voice: ${desiredVoice.name} (${desiredVoice.lang})`);
    } else {
        logger.warn(`No specific voice found for language: ${lang}. Using browser default.`);
    }

    window.speechSynthesis.speak(utterance);
};

const playRandomPhrase = (phrases: string[], lang: 'vi' | 'en') => {
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * phrases.length);
    } while (phrases.length > 1 && randomIndex === lastPhraseIndex);
    lastPhraseIndex = randomIndex;
    const phrase = phrases[randomIndex];
    speakText(phrase, lang);
};

export const playVictorySound = (lang: 'vi' | 'en') => {
  logger.log(`Playing victory sound for lang: ${lang}`);
  playCorrectSound();
  setTimeout(() => {
    const phrases = lang === 'vi' ? VI_VICTORY_PHRASES : EN_VICTORY_PHRASES;
    playRandomPhrase(phrases, lang);
  }, 200);
};

export const playEncouragementSound = (lang: 'vi' | 'en') => {
  logger.log(`Playing encouragement sound for lang: ${lang}`);
  playIncorrectSound();
  setTimeout(() => {
    const phrases = lang === 'vi' ? VI_ENCOURAGEMENT_PHRASES : EN_ENCOURAGEMENT_PHRASES;
    playRandomPhrase(phrases, lang);
  }, 200);
};
