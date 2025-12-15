import React from 'react';
import { Subject } from '../types.ts';
import { ClickIcon } from './icons/ClickIcon.tsx';
import { MathIcon } from './icons/MathIcon.tsx';
import { BookIcon } from './icons/BookIcon.tsx';
import { EnglishIcon } from './icons/EnglishIcon.tsx';
import { TrophyIcon } from './icons/TrophyIcon.tsx';
import { TypingIcon } from './icons/TypingIcon.tsx';

interface SubjectSelectorProps {
  onSelectSubject: (subject: Subject) => void;
  highScores: Record<string, number>;
}

const subjects = [
  { type: Subject.CLICKING, label: 'Luyện Chuột', color: 'from-green-400 to-lime-500 hover:from-green-500 hover:to-lime-600', icon: <ClickIcon className="w-20 h-20" /> },
  { type: Subject.MATH, label: 'Toán Học', color: 'from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600', icon: <MathIcon className="w-20 h-20" /> },
  { type: Subject.VIETNAMESE, label: 'Tiếng Việt', color: 'from-red-400 to-rose-500 hover:from-red-500 hover:to-rose-600', icon: <BookIcon className="w-20 h-20" /> },
  { type: Subject.ENGLISH, label: 'Tiếng Anh', color: 'from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600', icon: <EnglishIcon className="w-20 h-20" /> },
  { type: Subject.TYPING, label: 'Luyện Gõ Phím', color: 'from-purple-400 to-fuchsia-500 hover:from-purple-500 hover:to-fuchsia-600', icon: <TypingIcon className="w-20 h-20" /> },
];

const SubjectSelector: React.FC<SubjectSelectorProps> = ({ onSelectSubject, highScores }) => {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-2 text-slate-700">Chọn một môn học!</h2>
      <p className="text-lg mb-8 text-slate-500">Bé muốn chơi trò gì hôm nay?</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {subjects.map(({ type, label, color, icon }) => (
          <button
            key={type}
            onClick={() => onSelectSubject(type)}
            className={`flex flex-col items-center justify-between p-6 bg-gradient-to-br ${color} text-white rounded-2xl shadow-lg transform hover:-translate-y-2 transition-transform duration-300 ease-in-out border-4 border-white/50 focus:outline-none focus:ring-4 focus:ring-yellow-300 min-h-[240px]`}
          >
            <div className="text-center">
              <div className="mb-2 flex justify-center">{icon}</div>
              <h3 className="text-3xl font-bold">{label}</h3>
            </div>
            
            <div className="flex items-center gap-2 mt-4 bg-black/20 px-4 py-1 rounded-full">
                <TrophyIcon className="w-6 h-6 text-yellow-300" />
                <span className="font-semibold text-lg">Điểm cao: {highScores[type] || 0}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SubjectSelector;