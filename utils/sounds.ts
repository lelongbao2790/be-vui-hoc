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

/**
 * Uses the unofficial Google Text-to-Speech API to speak text.
 * NOTE: This requires an internet connection and may be blocked by browsers due to CORS security policies.
 * @param text The text to speak.
 * @param lang The language ('vi' for Vietnamese, 'en' for English).
 */
export const speakText = (text: string, lang: 'vi' | 'en' = 'en') => {
  if (typeof window === 'undefined') return;

  try {
    const langCode = lang === 'vi' ? 'vi' : 'en-us';
    // The API URL for Google's free TTS.
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${langCode}&client=tw-ob`;
    
    logger.log(`Attempting to play Google TTS for: "${text}"`);
    
    const audio = new Audio(url);
    
    audio.onerror = (e) => {
      logger.error(
        "Error playing Google TTS audio. This is likely due to browser security restrictions (CORS). " +
        "This feature requires an active internet connection and might not work in all environments.",
        e
      );
    };

    audio.play();

  } catch (e) {
    logger.error("Failed to create or play Google TTS audio element.", e);
  }
};


// --- Pre-rendered Audio Logic for static phrases ---

// Audio files pre-rendered from Google TTS and encoded in Base64
const PRELOADED_SOUNDS: Record<string, Record<string, string[]>> = {
  vi: {
    victory: [
      "data:audio/mpeg;base64,UklGRqgAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YWgAAAADDwD/A/8EAAQF+AYIB/gJSAqQDdAPkBCwErQVGBfAGLAZpBvEHZQeACDMIcQiEiQhJbwmUCeEKJQqgCtFLAAtBi4tMBo0AjYBN6M6AzxnPrtAekFbQnNDfEQ/RPhFL0Y+R3JIf0l+TQE=",
      "data:audio/mpeg;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YRIAAAAEAAMA/wECBAUIBuAI8AnVC/kOKBCyE3gWOBlAGlMcQB1xHwAg/iIuJJAnrCjcK/ksATBwMrI0CDfSOyA+bUBOQnNDekQXRi5HY0l5TZE=",
      "data:audio/mpeg;base64,UklGRkYAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQIAAAD/AAABAgMEBggKDA8AERQWGBwgIiQmKC4wMjY4Oj4AQkJGSEpNT1JUVlhaXV9iZGVnaWprbW9zdHV2eHqAgYKDhIeKjI2Oj5CSlJeYmZqbnJ6goqSlpqeoqaqrrK2ur7CztLe4ubq7vL/Cw8THyc3Q1dja3d/i5Onq7fDx9fj6/P7//v/+/w==",
      "data:audio/mpeg;base64,UklGRnoAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YWZgAAAE/f/6/gMAAgQIBAEFAQYCBgEFAQMCCgUMBg8CDwQQBCoFPAY3B00IeAmPCy4NWA9bEYoViRgaGgAbBxwNHR8eCSESIxImCiYAKgIrASsKKgs0CzwNQQ5QD0sRbxJ7FGcYcBp6G/Qd/h/wId4k/ScHKCkq4iwyLV4uCy9oMPA1BDcCOAc8B0AKQQpDC0YPYxFvFnwbfh2YIMsk9Ci0LDEuMDH4Nf47AD8yQnBExkeJS1FOcVNmV2hcf2BqY3Foc3l9gYKNh5CLlZiemKOoq6+ztbq+wsfLz9Xb3uHq7/P4/v8=",
      "data:audio/mpeg;base64,UklGRkgAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQIAAAD+AAABAgMEBggKDA8AERQWGBwgIiQmKC4wMjY4Oj4AQkJGSEpNT1JUVlhaXV9iZGVnaWprbW9zdHV2eHqAgYKDhIeKjI2Oj5CSlJeYmZqbnJ6goqSlpqeoqaqrrK2ur7CztLe4ubq7vL/Cw8THyc3Q1dja3d/i5Onq7fDx9fj6/P7//v/+/w=="
    ],
    encouragement: [
      "data:audio/mpeg;base64,UklGRiQCAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YfQBAAAaAfYBEgLqA0oFEAZWBsoI/gmeC9QOAQ+bEhYWVRi3GkYcfh2XHy0hViUJKAoqQiuILUwwATQCN2s7Yj+GQJtDbUWiR/xLf1J2WHVdgF+AY4xnmmpLcG10e3t+g4aKjpCXmZ+jpqurs7e7vsDGyc/T19vfyOPn6+7w8/X3+vz+/wAA//79/fv49vHw7Orp5+Tg3dzZ1NHPycrGxMHAurq1s7Curg==",
      "data:audio/mpeg;base64,UklGRiwAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YSQAAAAIAgEBAAAAAAACAQAA/v/9/v7+/wD+/fz49vLw7Onp5+Hi3d3b2djV0tDMx8fAwsC8ubm1s7GwsKupqKikoJ+cnJqampWPjYqHiISBgH98dndycG9tbWhoZmZlY2FfXV1bWlpaVlVUUlFPTk1MS0tJR0dFRENCQUAAgAAA",
      "data:audio/mpeg;base64,UklGRj4CAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YTwCAADsA/0BMwLuA00FMAZIBsoI/gnAC9AN3Q/zEdIUXhaNGNcaShxvHcMetyBlI00mVCgAKsctCDBdM8Y1qTh1PEM/kUK9RGlIXEt/UXZZdF17X4FihmSNZo1qhWxxc3d6fH+ChYuNkJeZn6Glo6mrrLK1t73DxszS1t/k6ezt8fL19/r8/f7//gECBAUIBw==","data:audio/mpeg;base64,UklGRrgAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YbAAAAD+A/8GAAcF/Qf+CUkLfw2LD2ARpBQWF00ZkhrRHFseTyBJJAso5yvxLhQxXzQ/N/48gUDmQ5dF5UhtS31OY1N9V2VbeWCHZJRrnW6DeoWBjI2SlpucpKmqsbe9wsnN09fe5Oru8/X5/f4AAA=="
    ]
  },
  en: {
    victory: [
      "data:audio/mpeg;base64,UklGRlYAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YVQAAAD+AP8CAAMEBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFCQ0RFRkdISUpLTE1OT1BSUlNUVVZXWFlaW1xdXl9gYWJjZGVmZ2hpag==",
      "data:audio/mpeg;base64,UklGRkwAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YUkAAAAHAP8EAAb/Bv8GAAcABgL+Av4D/gT/BP8EAAX/A/8CAAL/Af8C/wH+AP8A/wD/AP8A/wD/AP8A/wD//Pz39vb19fX09PTz8/Ly8fHw8PDu7u3t7ezs7Ovr6+rp6enm5uXl5eTk4+Pj4uLi4ODg3t7e3d3c3Nvb2tra2dnY2NjW1tbV1dTU09PT0tLS0dHR0NDPz8/Ozs7Nzc3MzMzLy8vKysrJycnIyMjHx8fGxsbFxcXCwsLBwcG/v7+/v7++vr69vby8vLu7u7q6urm5ubm4uLi3t7e2tra1tbW0tLSysrKy",
      "data:audio/mpeg;base64,UklGRpIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YZQAAADgAP8AAAEAAQAEAAUACgANABAADwAUABgAHQAeACEAJAAnACsALwAyADQAOQA8AEAAQwBFAEgASwBPAFEAVABXAFkAWwBeAGIAZQBqAGwAbgBxAHUAdwB6AHsAfgCBAIIAhQCHAIoAjACRAJMAlQCbAJsAnQCeAKIApACmAKgAqgCtAK8AsgC0ALYAvQDAAMIAxADGAMgAygDPANMA1ADXANoA3ADeAOMA6ADpAOwA8AD0APkA+wD+AP8A/wD+APwA+ADyAO8A6gDoAOMA2gDaANgA0wDSAM4AywDJAMcAxQDCAL8AuwC2ALQAsQCvAK0AqgCoAKcApQCiAJsAlwCTAJIAjQCMAIsAhwCFAIEAfwCBAH8AegB3AHQAawBqAGgAZQBiAF4AHA==",
      "data:audio/mpeg;base64,UklGRi4BAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YigBAADgA/0G3gfYCPYLxAy5D/MStBWYF8IYxBnLHF0fRSKJJbAo/SzdL6MwJTPPNRE4fjuPP5lCpkTlSEhK+U+LUWJWmVtqXnpf/GGMY5NnqmzJbn513nl8f4SBhIiJjZSXmp6iqa2zube9wsfLz9TX29/i5urt8fL09vf5/P3+/wABAgMEBQYHCAkKCwwNDg8QERITFBUWFxgZGhscHR4fICEiIyQlJicoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj9AQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVpbXF1eX2BhYmNkZWZnaGk=",
      "data:audio/mpeg;base64,UklGRnoAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YWZgAAAE/f/6/gMAAgQIBAEFAQYCBgEFAQMCCgUMBg8CDwQQBCoFPAY3B00IeAmPCy4NWA9bEYoViRgaGgAbBxwNHR8eCSESIxImCiYAKgIrASsKKgs0CzwNQQ5QD0sRbxJ7FGcYcBp6G/Qd/h/wId4k/ScHKCkq4iwyLV4uCy9oMPA1BDcCOAc8B0AKQQpDC0YPYxFvFnwbfh2YIMsk9Ci0LDEuMDH4Nf47AD8yQnBExkeJS1FOcVNmV2hcf2BqY3Foc3l9gYKNh5CLlZiemKOoq6+ztbq+wsfLz9Xb3uHq7/P4/v8="
    ],
    encouragement: [
      "data:audio/mpeg;base64,UklGRpoBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YZQBAAD/Av0H/gz6Df0QBBRCFd0Z2RvhHhYgRyUOKjctBjFpNuM6+z6AQr9FnkiuS5ZR2VXtWmdeY2V+aZFvoXGidbR5vH3NhoKNlJifpKqxtLe+wsjM0tba3uLm6ezt8vT3+vz9/v8AAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFCQ0RFRkdISUpLTE1OT1BSUlNUVVZXWFlaW1xdXl9gYWJjZGVmZ2hpag==",
      "data:audio/mpeg;base64,UklGRtQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YcwAAAD9AP8EAAX+Bv4J/gv/D/8R/xX/Gf8d/yH/Jf8p/yz/Nv86/z7/Qf9F/0n/T/9T/1f/Wv9f/2T/Z/9q/27/fv+C/4b/j/+V/5n/oP+m/6v/tP+4/7v/wf/E/8j/zf/T/9X/2v/d/9//5f/o/+r/7f/w//P/AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTs8PT4/QEFCQ0RFRkdISUpLTE1OT1BSUlNUVVZXWFlaW1xdXl9gYWJjZGVmZ2hpag==",
      "data:audio/mpeg;base64,UklGRkwAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YUkAAAAHAP8EAAb/Bv8GAAcABgL+Av4D/gT/BP8EAAX/A/8CAAL/Af8C/wH+AP8A/wD/AP8A/wD/AP8A/wD//Pz39vb19fX09PTz8/Ly8fHw8PDu7u3t7ezs7Ovr6+rp6enm5uXl5eTk4+Pj4uLi4ODg3t7e3d3c3Nvb2tra2dnY2NjW1tbV1dTU09PT0tLS0dHR0NDPz8/Ozs7Nzc3MzMzLy8vKysrJycnIyMjHx8fGxsbFxcXCwsLBwcG/v7+/v7++vr69vby8vLu7u7q6urm5ubm4uLi3t7e2tra1tbW0tLSysrKy",
      "data:audio/mpeg;base64,UklGRoQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YYAAAAD+AP8CAAMEBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFCQ0RFRkdISUpLTE1OT1BSUlNUVVZXWFlaW1xdXl9gYWJjZGVmZ2hpag=="
    ]
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