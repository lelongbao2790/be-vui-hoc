import React from 'react';
import type { Level, Difficulty } from '../types.ts';
import { Difficulty as DifficultyEnum } from '../types.ts';
import { LevelType } from '../types.ts';

interface DifficultySelectorProps {
  level: Level;
  onSelectDifficulty: (difficulty: Difficulty) => void;
}

// FIX: Added missing preschool level types to satisfy the Record type.
const difficultyLabels: Record<LevelType, Partial<Record<Difficulty, string>>> = {
    [LevelType.CLICK_BASIC]: {
        [DifficultyEnum.EASY]: 'Dễ (60 giây)',
        [DifficultyEnum.MEDIUM]: 'Vừa (45 giây)',
        [DifficultyEnum.HARD]: 'Khó (30 giây)',
    },
    [LevelType.MATH_ADD_SUBTRACT]: {
        [DifficultyEnum.EASY]: 'Dễ (Không nhớ)',
        [DifficultyEnum.HARD]: 'Khó (Có nhớ)',
    },
    [LevelType.VIETNAMESE_SCRAMBLE_WORD]: {
        [DifficultyEnum.EASY]: 'Dễ (Câu ngắn)',
        [DifficultyEnum.HARD]: 'Khó (Câu dài)',
    },
    [LevelType.VIETNAMESE_RHYME_MATCH]: {
        [DifficultyEnum.EASY]: 'Dễ (Vần đơn giản)',
        [DifficultyEnum.HARD]: 'Khó (Vần phức tạp)',
    },
    [LevelType.ENGLISH_FILL_WORD]: {
        [DifficultyEnum.EASY]: 'Dễ (Từ 3-4 chữ)',
        [DifficultyEnum.MEDIUM]: 'Vừa (Từ 5+ chữ)',
    },
    [LevelType.ENGLISH_LISTEN_TYPE]: {
        [DifficultyEnum.EASY]: 'Dễ (Từ 3-4 chữ)',
        [DifficultyEnum.MEDIUM]: 'Vừa (Từ 5+ chữ)',
    },
    [LevelType.ENGLISH_IMAGE_WORD_MATCH]: {
        [DifficultyEnum.EASY]: 'Dễ (Từ phổ biến)',
        [DifficultyEnum.MEDIUM]: 'Vừa (Từ ít gặp hơn)',
    },
    [LevelType.ENGLISH_LISTEN_FILL_SENTENCE]: {
        [DifficultyEnum.EASY]: 'Dễ (Câu đơn giản)',
        [DifficultyEnum.MEDIUM]: 'Vừa (Câu phức tạp)',
    },
    [LevelType.CLICK_TARGET]: {},
    [LevelType.VIETNAMESE_FILL_WORD]: {},
    // Fix: Add missing properties for TYPING_BASIC and TYPING_VIETNAMESE_VOWELS
    [LevelType.TYPING_BASIC]: {},
    [LevelType.TYPING_VIETNAMESE_VOWELS]: {},
    [LevelType.PRESCHOOL_COLORS]: {},
    [LevelType.PRESCHOOL_ANIMALS]: {},
    [LevelType.PRESCHOOL_OBJECTS]: {},
    [LevelType.PRESCHOOL_SHAPES]: {},
    [LevelType.PRESCHOOL_COUNTING]: {},
};

const getLabel = (levelType: LevelType, difficulty: Difficulty): string => {
    return difficultyLabels[levelType]?.[difficulty] || difficulty;
}


const DifficultySelector: React.FC<DifficultySelectorProps> = ({ level, onSelectDifficulty }) => {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-2 text-slate-700">Chọn độ khó cho</h2>
      <p className="text-2xl font-bold mb-8 text-sky-600">{level.title}</p>
      
      <div className="flex flex-col items-center gap-4 mb-8">
        {level.difficulties.map((difficulty) => (
          <button
            key={difficulty}
            onClick={() => onSelectDifficulty(difficulty)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-10 text-2xl rounded-full shadow-lg transition-transform transform hover:scale-105 w-64"
          >
            {getLabel(level.type, difficulty)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DifficultySelector;