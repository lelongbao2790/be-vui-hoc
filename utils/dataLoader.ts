import {
  VIETNAMESE_WORDS,
  VIETNAMESE_SCRAMBLE_SENTENCES,
  VIETNAMESE_RHYMES,
  VIETNAMESE_VOWEL_RULES,
  ENGLISH_WORDS,
  ENGLISH_SENTENCES,
  PRESCHOOL_ANIMALS,
  PRESCHOOL_OBJECTS,
  PRESCHOOL_COLORS,
  PRESCHOOL_SHAPES,
} from './gameData.ts';

// --- Lớp 1 ---
export const getVietnameseWords = () => Promise.resolve(VIETNAMESE_WORDS);
export const getVietnameseScrambleSentences = () => Promise.resolve(VIETNAMESE_SCRAMBLE_SENTENCES);
export const getVietnameseRhymes = () => Promise.resolve(VIETNAMESE_RHYMES);
export const getVietnameseVowelRules = () => Promise.resolve(VIETNAMESE_VOWEL_RULES);
export const getEnglishWords = () => Promise.resolve(ENGLISH_WORDS);
export const getEnglishSentences = () => Promise.resolve(ENGLISH_SENTENCES);

// --- Mầm Non ---
export const getPreschoolAnimals = () => Promise.resolve(PRESCHOOL_ANIMALS);
export const getPreschoolObjects = () => Promise.resolve(PRESCHOOL_OBJECTS);
export const getPreschoolColors = () => Promise.resolve(PRESCHOOL_COLORS);
export const getPreschoolShapes = () => Promise.resolve(PRESCHOOL_SHAPES);