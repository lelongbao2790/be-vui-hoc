
import React, { useEffect, useState } from 'react';
import { testIdFor } from '../utils/testIds';

type FeedbackStatus = 'correct' | 'incorrect' | null;

interface FeedbackIndicatorProps {
  status: FeedbackStatus;
}

const FeedbackIndicator: React.FC<FeedbackIndicatorProps> = ({ status }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!visible || !status) return null;

  const isCorrect = status === 'correct';
  const config = {
    bgColor: isCorrect ? 'bg-green-500' : 'bg-red-500',
    borderColor: isCorrect ? 'border-green-700' : 'border-red-700',
    text: isCorrect ? 'Đúng rồi!' : 'Sai rồi!',
    icon: isCorrect ? '✅' : '❌',
  };

  return (
    <div data-testid={testIdFor('feedback','overlay')} className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div data-testid={testIdFor('feedback','box')} className={`flex items-center gap-4 p-6 rounded-2xl text-white font-bold text-4xl shadow-2xl animate-bounce ${config.bgColor} border-4 ${config.borderColor}`}>
        <span>{config.icon}</span>
        <span>{config.text}</span>
      </div>
    </div>
  );
};

export default FeedbackIndicator;
