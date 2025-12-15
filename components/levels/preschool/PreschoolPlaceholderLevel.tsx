import React from 'react';
import type { Level } from '../../../types';

interface PreschoolPlaceholderLevelProps {
  level: Level;
}

const PreschoolPlaceholderLevel: React.FC<PreschoolPlaceholderLevelProps> = ({ level }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="text-8xl mb-6">🚧</div>
      <h2 className="text-4xl font-bold text-sky-600">Sắp ra mắt!</h2>
      <p className="text-xl text-slate-500 mt-2">
        Trò chơi <span className="font-bold">{level.title}</span> đang được phát triển.
      </p>
      <p className="text-lg text-slate-500">Vui lòng quay lại sau nhé bé!</p>
    </div>
  );
};

export default PreschoolPlaceholderLevel;