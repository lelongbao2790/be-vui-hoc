
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getVietnameseVowelRules } from '../../utils/dataLoader.ts';
import { playCorrectSound } from '../../utils/sounds.ts';
import { logger } from '../../utils/logger.ts';
import type { Difficulty, VietnameseVowelRule } from '../../types.ts';
import FeedbackIndicator from '../FeedbackIndicator.tsx';

interface TypingVietnameseVowelsLevelProps {
  difficulty: Difficulty;
  onCorrect: () => void;
  onStatusUpdate: (status: {}) => void;
  onGameEnd: () => void;
}

type FeedbackStatus = 'correct' | null;

const TypingVietnameseVowelsLevel: React.FC<TypingVietnameseVowelsLevelProps> = ({ onCorrect, onGameEnd }) => {
  const [rules, setRules] = useState<VietnameseVowelRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<FeedbackStatus>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getVietnameseVowelRules().then(data => {
      setRules(data);
      setIsLoading(false);
      logger.log('Vietnamese vowel rules loaded.');
    });
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIndex]);

  const currentRule = rules[currentIndex];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typedValue = e.target.value;
    setInputValue(typedValue);

    if (currentRule && typedValue.endsWith(currentRule.result)) {
        playCorrectSound();
        setFeedback('correct');
        onCorrect();

        setTimeout(() => {
            setInputValue('');
            setFeedback(null);
            if (currentIndex < rules.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                // Game finished, maybe show a summary or reset
                onGameEnd();
                setCurrentIndex(0); // Loop back
            }
        }, 500);
    }
  };
  
  const resetGame = () => {
    logger.log('Resetting Vietnamese Vowels game.');
    setCurrentIndex(0);
    setInputValue('');
    setFeedback(null);
  };

  if (isLoading) return <div>Đang tải dữ liệu...</div>;
  if (!currentRule) return <div>Hoàn thành!</div>;

  return (
    <div className="w-full flex flex-col md:flex-row items-start justify-center relative gap-8">
        {/* Helper Panel */}
        <div className="w-full md:w-1/3 bg-slate-100 p-4 rounded-lg border-2 border-slate-200">
            <h3 className="text-2xl font-bold mb-2 text-center">Bảng gõ Telex</h3>
            <ul className="space-y-2">
                {rules.map(rule => (
                    <li key={rule.result} className={`p-2 rounded transition-colors flex items-center justify-around ${rule.result === currentRule.result ? 'bg-yellow-200' : ''}`}>
                        <span className="font-mono font-bold text-purple-700 text-2xl">{rule.guide}</span>
                        <span className="text-3xl mx-2">=</span>
                        <span className="font-bold text-4xl text-purple-700">{rule.result}</span>
                    </li>
                ))}
            </ul>
        </div>

        {/* Main Game Panel */}
        <div className="w-full md:w-2/3 flex flex-col items-center text-center">
            <p className="text-3xl font-semibold mb-2">{currentRule.description}</p>
            <p className="text-4xl mb-4">Bây giờ hãy gõ:</p>
            
            <div className="text-9xl font-bold text-sky-600 mb-6 drop-shadow-md">
                {currentRule.result}
            </div>

            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                className="w-48 h-20 text-center text-6xl font-bold text-rose-600 bg-rose-100 border-4 border-rose-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-yellow-300"
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                autoFocus
            />
        </div>
        <FeedbackIndicator status={feedback} />
    </div>
  );
};

export default TypingVietnameseVowelsLevel;
