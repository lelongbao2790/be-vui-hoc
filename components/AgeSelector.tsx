import React from 'react';
import { TeddyBearIcon } from './icons/TeddyBearIcon';
import { AppleIcon } from './icons/AppleIcon';

type AgeGroup = 'preschool' | 'grade1';

interface AgeSelectorProps {
  onSelectAgeGroup: (ageGroup: AgeGroup) => void;
}

const AgeSelector: React.FC<AgeSelectorProps> = ({ onSelectAgeGroup }) => {
  return (
    <div className="text-center">
      <h2 className="text-4xl font-bold mb-2 text-slate-700">Bé đang học lớp mấy?</h2>
      <p className="text-lg mb-8 text-slate-500">Hãy chọn lứa tuổi của mình nhé!</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <button
          onClick={() => onSelectAgeGroup('preschool')}
          className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-yellow-300 to-orange-400 text-orange-800 rounded-2xl shadow-lg transform hover:-translate-y-2 transition-transform duration-300 ease-in-out border-4 border-white/50 focus:outline-none focus:ring-4 focus:ring-yellow-300 min-h-[280px]"
        >
          <div className="mb-4"><TeddyBearIcon className="w-24 h-24" /></div>
          <h3 className="text-4xl font-bold">Mầm Non</h3>
          <p className="text-lg mt-1">(Bé 3-5 tuổi)</p>
        </button>
        <button
          onClick={() => onSelectAgeGroup('grade1')}
          className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-lime-400 to-green-500 text-green-900 rounded-2xl shadow-lg transform hover:-translate-y-2 transition-transform duration-300 ease-in-out border-4 border-white/50 focus:outline-none focus:ring-4 focus:ring-lime-300 min-h-[280px]"
        >
          <div className="mb-4"><AppleIcon className="w-24 h-24" /></div>
          <h3 className="text-4xl font-bold">Lớp 1</h3>
          <p className="text-lg mt-1">(Bé 6 tuổi)</p>
        </button>
      </div>
    </div>
  );
};

export default AgeSelector;