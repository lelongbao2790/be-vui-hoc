import React, { useState, useEffect, useCallback } from 'react';
import { playCorrectSound, playEncouragementSound } from '../../utils/sounds';
import FeedbackIndicator from '../FeedbackIndicator';
import { TARGET_EMOJIS } from '../../constants';
import { useGameLogic } from '../../hooks/useGameLogic';
import GameEndScreen from '../GameEndScreen';
import ReviewMistakesScreen from '../ReviewMistakesScreen';
import SpeechText from '../SpeechText';

interface ClickTargetLevelProps {
  onCorrect: () => void;
  onGameEnd: () => void;
  onStatusUpdate: (status: { currentQuestion: number; totalQuestions: number; }) => void;
  onGoToMenu: () => void;
}

interface IncorrectAttempt {
  targets: { emoji: string; number: number }[];
  correctNumber: number;
  clickedNumber: number;
}

type FeedbackStatus = 'correct' | 'incorrect' | null;
const TOTAL_QUESTIONS = 5;

const ClickTargetLevel: React.FC<ClickTargetLevelProps> = ({ onCorrect, onGameEnd, onStatusUpdate, onGoToMenu }) => {
  const [targets, setTargets] = useState<{ emoji: string; number: number }[]>([]);
  const [correctNumber, setCorrectNumber] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackStatus>(null);
  
  const gameLogic = useGameLogic<IncorrectAttempt>({
    totalQuestions: TOTAL_QUESTIONS,
    timeLimit: 120, // Time limit is generous, game ends after 5 questions
    onGameEnd,
    onCorrect,
    onStatusUpdate,
    lang: 'vi',
  });

  const { gameState, score, incorrectAttempts, isReviewing, handleCorrect, handleIncorrect, resetGame, setIsReviewing } = gameLogic;

  const shuffleArray = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  // Reserve 100px at the top for SpeechText
  const generateNewChallenge = useCallback(() => {
    const MAX_TARGETS = 5;
    const shuffledAnimals = shuffleArray(TARGET_EMOJIS);
    const uniqueNumbers = new Set<number>();
    while(uniqueNumbers.size < MAX_TARGETS) {
        uniqueNumbers.add(Math.floor(Math.random() * 30) + 1);
    }
    const numbers = Array.from(uniqueNumbers);

    // For each target, generate a random position avoiding the top 120px
    const minTopPx = 120;
    const maxTopPx = 400;
    const minLeftPct = 5;
    const maxLeftPct = 85;
    const newTargets = numbers.map((num, index) => ({
      emoji: shuffledAnimals[index],
      number: num,
      // Add random position for each target
      top: `${Math.floor(Math.random() * (maxTopPx - minTopPx)) + minTopPx}px`,
      left: `${Math.floor(Math.random() * (maxLeftPct - minLeftPct)) + minLeftPct}%`,
    }));

    setTargets(newTargets);
    setCorrectNumber(numbers[Math.floor(Math.random() * MAX_TARGETS)]);
  }, []);

  useEffect(() => {
    generateNewChallenge();
  }, [generateNewChallenge, gameLogic.currentQuestionIndex]);

  const handleClick = (clickedNumber: number) => {
    if (feedback) return;

    if (clickedNumber === correctNumber) {
      playCorrectSound();
      setFeedback('correct');
      setTimeout(() => {
        handleCorrect();
        setFeedback(null);
      }, 1000);
    } else {
      playEncouragementSound('vi');
      setFeedback('incorrect');
      handleIncorrect({ targets, correctNumber, clickedNumber });
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  if (gameState === 'finished') {
    if (isReviewing) {
        return (
            <ReviewMistakesScreen
                incorrectAttempts={incorrectAttempts}
                onBack={() => setIsReviewing(false)}
                renderAttempt={(attempt: IncorrectAttempt, index) => (
                    <div key={index} className="p-3 bg-red-100 rounded-lg text-left">
                        <p className="font-bold text-xl">Câu hỏi: Click vào số {attempt.correctNumber}</p>
                        <p className="text-lg text-red-700">Bé chọn: {attempt.clickedNumber}</p>
                    </div>
                )}
            />
        );
    }
    return (
        <GameEndScreen
            title="Hoàn thành!"
            onReset={resetGame}
            onGoToMenu={onGoToMenu}
            onReview={() => setIsReviewing(true)}
            showReviewButton={incorrectAttempts.length > 0}
        >
            <p className="text-3xl">Bé đã trả lời đúng: <span className="font-bold text-blue-600">{score} / {TOTAL_QUESTIONS}</span> câu</p>
        </GameEndScreen>
    )
  }


  return (
    <div className="w-full flex flex-col items-center justify-center relative">
      {/* Reserve space for SpeechText at the top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-full max-w-md px-4 pointer-events-none" style={{ height: 100 }}>
        <SpeechText
          text={`Click vào con vật có số ${correctNumber}`}
          lang="vi"
          className="mb-2 pointer-events-auto"
        />
      </div>
      {/* Spacer to push game area below SpeechText */}
      <div style={{ height: 100 }} />
      <div className="w-full h-full flex-1 flex items-center justify-center">
        {targets.map(({ emoji, number, top, left }) => (
          <button
            key={number}
            onClick={() => handleClick(number)}
            className="absolute flex flex-col items-center justify-center w-28 h-28 md:w-36 md:h-36 bg-white rounded-2xl shadow-lg transform hover:scale-110 transition-transform duration-200 border-4 border-sky-300"
            style={{ top, left }}
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