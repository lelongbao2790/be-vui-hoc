import React from 'react';
import type { Level } from '../types';
import { PRESCHOOL_LEVELS } from '../constants';
import { PaletteIcon } from './icons/PaletteIcon';
import { PawIcon } from './icons/PawIcon';
import { BlocksIcon } from './icons/BlocksIcon';
import { ShapesIcon } from './icons/ShapesIcon';
import { NumbersIcon } from './icons/NumbersIcon';

interface PreschoolSelectorProps {
  onSelectLevel: (level: Level) => void;
}

const subjectDetails: Record<string, { icon: React.ReactElement, color: string }> = {
  PRESCHOOL_COLORS: { icon: <PaletteIcon className="w-20 h-20" />, color: 'from-red-400 to-pink-500' },
  PRESCHOOL_ANIMALS: { icon: <PawIcon className="w-20 h-20" />, color: 'from-orange-400 to-amber-500' },
  PRESCHOOL_OBJECTS: { icon: <BlocksIcon className="w-20 h-20" />, color: 'from-sky-400 to-cyan-500' },
  PRESCHOOL_SHAPES: { icon: <ShapesIcon className="w-20 h-20" />, color: 'from-violet-400 to-purple-500' },
  PRESCHOOL_COUNTING: { icon: <NumbersIcon className="w-20 h-20" />, color: 'from-lime-400 to-green-500' },
};


const PreschoolSelector: React.FC<PreschoolSelectorProps> = ({ onSelectLevel }) => {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-2 text-slate-700">Cùng chơi và học nào!</h2>
      <p className="text-lg mb-8 text-slate-500">chọn một trò chơi bên dưới nhé.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {PRESCHOOL_LEVELS.map((level) => (
          <button
            key={level.type}
            onClick={() => onSelectLevel(level)}
            className={`flex flex-col items-center justify-center p-6 bg-gradient-to-br ${subjectDetails[level.type].color} text-white rounded-2xl shadow-lg transform hover:-translate-y-2 transition-transform duration-300 ease-in-out border-4 border-white/50 focus:outline-none focus:ring-4 focus:ring-yellow-300 min-h-[240px]`}
          >
            <div className="mb-4">{subjectDetails[level.type].icon}</div>
            <h3 className="text-3xl font-bold">{level.title}</h3>
            <p className="text-sm mt-1 opacity-90 text-center">{level.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PreschoolSelector;