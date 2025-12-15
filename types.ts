
export enum Subject {
  CLICKING = 'CLICKING',
  MATH = 'MATH',
  VIETNAMESE = 'VIETNAMESE',
  ENGLISH = 'ENGLISH',
  TYPING = 'TYPING',
}

export enum PreschoolSubject {
  COLORS = 'PRESCHOOL_COLORS',
  ANIMALS = 'PRESCHOOL_ANIMALS',
  OBJECTS = 'PRESCHOOL_OBJECTS',
  SHAPES = 'PRESCHOOL_SHAPES',
  COUNTING = 'PRESCHOOL_COUNTING',
}


export enum LevelType {
  // Grade 1
  CLICK_BASIC = 'CLICK_BASIC',
  CLICK_TARGET = 'CLICK_TARGET',
  MATH_ADD_SUBTRACT = 'MATH_ADD_SUBTRACT',
  VIETNAMESE_FILL_WORD = 'VIETNAMESE_FILL_WORD',
  VIETNAMESE_SCRAMBLE_WORD = 'VIETNAMESE_SCRAMBLE_WORD',
  VIETNAMESE_RHYME_MATCH = 'VIETNAMESE_RHYME_MATCH',
  ENGLISH_FILL_WORD = 'ENGLISH_FILL_WORD',
  ENGLISH_LISTEN_TYPE = 'ENGLISH_LISTEN_TYPE',
  ENGLISH_IMAGE_WORD_MATCH = 'ENGLISH_IMAGE_WORD_MATCH',
  ENGLISH_LISTEN_FILL_SENTENCE = 'ENGLISH_LISTEN_FILL_SENTENCE',
  TYPING_BASIC = 'TYPING_BASIC',
  TYPING_VIETNAMESE_VOWELS = 'TYPING_VIETNAMESE_VOWELS',
  
  // Preschool
  PRESCHOOL_COLORS = 'PRESCHOOL_COLORS',
  PRESCHOOL_ANIMALS = 'PRESCHOOL_ANIMALS',
  PRESCHOOL_OBJECTS = 'PRESCHOOL_OBJECTS',
  PRESCHOOL_SHAPES = 'PRESCHOOL_SHAPES',
  PRESCHOOL_COUNTING = 'PRESCHOOL_COUNTING',
}

export enum Difficulty {
    EASY = 'EASY',
    MEDIUM = 'MEDIUM',
    HARD = 'HARD',
}

export interface Level {
  type: LevelType;
  subject: Subject | PreschoolSubject;
  title: string;
  description: string;
  difficulties: Difficulty[];
}

export interface VietnameseWord {
  image: string;
  sentence: string; // e.g., "Cơn m__"
  missing: string; // "ưa"
  to_type: string; // "ua"
  answer: string; // "mưa"
}

export interface EnglishWord {
  image: string;
  word: string;
  sentence: string; // e.g., "This is an a__ple."
  missing: string; // "p"
  difficulty: Difficulty;
}

export interface ScrambleSentence {
  sentence: string;
  difficulty: Difficulty;
}

export interface VietnameseRhymePair {
  word: string;
  rhyme: string;
  options: string[]; // should include the correct rhyme
  difficulty: Difficulty;
}

export interface EnglishSentence {
  image: string;
  sentence: string; // "The __ is yellow."
  missing: string; // "sun"
  difficulty: Difficulty;
}

export interface VietnameseVowelRule {
  result: string;
  guide: string;
  description: string;
}

// ---- Preschool Types ----
export interface PreschoolItem {
  id: string;
  name: string;
  image: string; // emoji
}

export interface PreschoolColor {
  id: string;
  name: string;
  hex: string;
}

export interface PreschoolShape {
  id: string;
  name: string;
}