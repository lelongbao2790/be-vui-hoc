
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { playCorrectSound, playEncouragementSound, playVictorySound } from '../../utils/sounds';
import FeedbackIndicator from '../FeedbackIndicator';
import { TARGET_EMOJIS } from '../../constants';
import { Difficulty } from '../../types';

interface ClickTargetLevelProps {
  difficulty: Difficulty;
  onCorrect: () => void;
  onGameEnd: () => void;
  onStatusUpdate: (status: { currentQuestion: number; totalQuestions: number; }) => void;
}

type FeedbackStatus = 'correct' | 'incorrect' | null;
type GameState = 'playing' | 'finished';

const MAX_TARGETS = 5;
const TOTAL_QUESTIONS = 5;

const ClickTargetLevel: React.FC<ClickTargetLevelProps> = ({ onCorrect, onGameEnd, onStatusUpdate }) => {
  const [targets, setTargets] = useState<{ emoji: string; number: number }[]>([]);
  const [correctNumber, setCorrectNumber] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackStatus>(null);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const gameEndedRef = useRef(false);

  useEffect(() => {
    onStatusUpdate({ currentQuestion: currentQuestionIndex + 1, totalQuestions: TOTAL_QUESTIONS });
  }, [currentQuestionIndex, onStatusUpdate]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  const generateNewChallenge = useCallback(() => {
    const shuffledAnimals = shuffleArray(TARGET_EMOJIS);
    const uniqueNumbers = new Set<number>();
    while(uniqueNumbers.size < MAX_TARGETS) {
        uniqueNumbers.add(Math.floor(Math.random() * 30) + 1);
    }
    const numbers = Array.from(uniqueNumbers);

    const newTargets = numbers.map((num, index) => ({
      emoji: shuffledAnimals[index],
      number: num,
    }));

    setTargets(newTargets);
    setCorrectNumber(numbers[Math.floor(Math.random() * MAX_TARGETS)]);
  }, []);

  useEffect(() => {
    generateNewChallenge();
    gameEndedRef.current = false;
  }, [generateNewChallenge]);

  const handleClick = (clickedNumber: number) => {
    if (feedback) return;

    if (clickedNumber === correctNumber) {
      playCorrectSound();
      setFeedback('correct');
      onCorrect();
      setScore(prev => prev + 1);
      setTimeout(() => {
          if (currentQuestionIndex < TOTAL_QUESTIONS - 1) {
              setCurrentQuestionIndex(prev => prev + 1);
              generateNewChallenge();
              setFeedback(null);
          } else {
              playVictorySound('vi');
              setGameState('finished');
              if (!gameEndedRef.current) {
                onGameEnd();
                gameEndedRef.current = true;
              }
          }
      }, 1000);
    } else {
      playEncouragementSound('vi');
      setFeedback('incorrect');
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  const resetGame = () => {
    setGameState('playing');
    setCurrentQuestionIndex(0);
    setScore(0);
    generateNewChallenge();
    gameEndedRef.current = false;
  };

  if (gameState === 'finished') {
    return (
        <div className="flex flex-col items-center gap-4 text-center">
            <h3 className="text-5xl font-bold text-rose-500">Hoàn thành!</h3>
            <p className="text-3xl">Bé đã trả lời đúng: <span className="font-bold text-blue-600">{score} / {TOTAL_QUESTIONS}</span> câu</p>
            <button
                onClick={resetGame}
                className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 text-2xl rounded-full shadow-lg transition-transform transform hover:scale-105"
            >
                Chơi lại
            </button>
        </div>
    )
  }

  return (
    <div className="w-full flex flex-col items-center justify-center relative">
        <h3 className="text-3xl md:text-4xl font-bold mb-8 p-4 bg-yellow-200 border-4 border-yellow-400 rounded-xl shadow-md">
            Click vào con vật có số <span className="text-red-500">{correctNumber}</span>
        </h3>
        <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            {targets.map(({ emoji, number }) => (
                <button
                    key={number}
                    onClick={() => handleClick(number)}
                    className="flex flex-col items-center justify-center w-28 h-28 md:w-36 md:h-36 bg-white rounded-2xl shadow-lg transform hover:scale-110 transition-transform duration-200 border-4 border-sky-300"
                >
                    <span className="text-5xl md:text-6xl">{emoji}</span>
                    <span className="text-2xl md:text-3xl font-bold mt-2">{number}</span>
                </button>
            ))}
        </div>
        <FeedbackIndicator status={feedback} />
    </div>
  );
};

export default ClickTargetLevel;