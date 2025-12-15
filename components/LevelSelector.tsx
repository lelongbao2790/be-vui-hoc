
import React from 'react';
import type { Level, Subject } from '../types.ts';
import { LevelType } from '../types.ts';
import { LEVELS } from '../constants.ts';
import { ClickIcon } from './icons/ClickIcon.tsx';
import { MathIcon } from './icons/MathIcon.tsx';
import { BookIcon } from './icons/BookIcon.tsx';
import { TargetIcon } from './icons/TargetIcon.tsx';
import { ShuffleIcon } from './icons/ShuffleIcon.tsx';
import { EnglishIcon } from './icons/EnglishIcon.tsx';
import { ListenIcon } from './icons/ListenIcon.tsx';
import { RhymeIcon } from './icons/RhymeIcon.tsx';
import { ImageWordMatchIcon } from './icons/ImageWordMatchIcon.tsx';
import { SentenceListenIcon } from './icons/SentenceListenIcon.tsx';
import { TypingIcon } from './icons/TypingIcon.tsx';
import { VietnameseVowelIcon } from './icons/VietnameseVowelIcon.tsx';

interface LevelSelectorProps {
  subject: Subject;
  onSelectLevel: (level: Level) => void;
}

const levelIcons: Record<LevelType, React.ReactElement> = {
    [LevelType.CLICK_BASIC]: <ClickIcon className="w-16 h-16" />,
    [LevelType.CLICK_TARGET]: <TargetIcon className="w-16 h-16" />,
    [LevelType.MATH_ADD_SUBTRACT]: <MathIcon className="w-16 h-16" />,
    [LevelType.VIETNAMESE_FILL_WORD]: <BookIcon className="w-16 h-16" />,
    [LevelType.VIETNAMESE_SCRAMBLE_WORD]: <ShuffleIcon className="w-16 h-16" />,
    [LevelType.VIETNAMESE_RHYME_MATCH]: <RhymeIcon className="w-16 h-16" />,
    [LevelType.ENGLISH_FILL_WORD]: <EnglishIcon className="w-16 h-16" />,
    [LevelType.ENGLISH_LISTEN_TYPE]: <ListenIcon className="w-16 h-16" />,
    [LevelType.ENGLISH_IMAGE_WORD_MATCH]: <ImageWordMatchIcon className="w-16 h-16" />,
    [LevelType.ENGLISH_LISTEN_FILL_SENTENCE]: <SentenceListenIcon className="w-16 h-16" />,
    [LevelType.TYPING_BASIC]: <TypingIcon className="w-16 h-16" />,
    [LevelType.TYPING_VIETNAMESE_VOWELS]: <VietnameseVowelIcon className="w-16 h-16" />,
};

const levelColors: Record<string, string> = {
    CLICK: 'from-green-400 to-lime-500 hover:from-green-500 hover:to-lime-600',
    MATH: 'from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600',
    VIETNAMESE: 'from-red-400 to-rose-500 hover:from-red-500 hover:to-rose-600',
    ENGLISH: 'from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600',
    TYPING: 'from-purple-400 to-fuchsia-500 hover:from-purple-500 hover:to-fuchsia-600',
}

const LevelSelector: React.FC<LevelSelectorProps> = ({ subject, onSelectLevel }) => {
  const subjectLevels = LEVELS.filter(level => level.subject === subject);
  
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-2 text-slate-700">Chọn một trò chơi!</h2>
      <p className="text-lg mb-8 text-slate-500">Hãy cùng thử sức nào bé ơi!</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {subjectLevels.map((level) => {
          const colorKey = Object.keys(levelColors).find(key => level.type.startsWith(key));
          const colorClass = colorKey ? levelColors[colorKey] : 'from-gray-400 to-gray-500';

          return (
            <button
              key={level.type}
              onClick={() => onSelectLevel(level)}
              className={`flex flex-col items-center justify-center p-6 bg-gradient-to-br ${colorClass} text-white rounded-2xl shadow-lg transform hover:-translate-y-2 transition-transform duration-300 ease-in-out border-4 border-white/50 focus:outline-none focus:ring-4 focus:ring-yellow-300 min-h-[200px]`}
            >
              <div className="mb-4">{levelIcons[level.type]}</div>
              <h3 className="text-xl font-bold text-center">{level.title}</h3>
              <p className="text-sm mt-1 opacity-90 text-center">{level.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LevelSelector;
