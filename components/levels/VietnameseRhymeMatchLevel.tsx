import React, { useState, useEffect, useCallback } from 'react';
import { getVietnameseRhymes } from '../../utils/dataLoader';
import type { VietnameseRhymePair, Difficulty } from '../../types';
import { playCorrectSound, playEncouragementSound } from '../../utils/sounds';
import FeedbackIndicator from '../FeedbackIndicator';
import { useGameLogic } from '../../hooks/useGameLogic';
import GameEndScreen from '../GameEndScreen';
import ReviewMistakesScreen from '../ReviewMistakesScreen';


interface IncorrectAttempt {
    pair: VietnameseRhymePair;
    selectedOption: string;
}

interface VietnameseRhymeMatchLevelProps {
  difficulty: Difficulty;
  onCorrect: () => void;
  onStatusUpdate: (status: { timeLeft: number; currentQuestion: number; totalQuestions: number; }) => void;
  onGameEnd: () => void;
}

type FeedbackStatus = 'correct' | 'incorrect' | null;

const TOTAL_QUESTIONS = 5;
const TIME_LIMIT = 90;

const VietnameseRhymeMatchLevel: React.FC<VietnameseRhymeMatchLevelProps> = ({ difficulty, onCorrect, onStatusUpdate, onGameEnd }) => {
  const [allPairs, setAllPairs] = useState<VietnameseRhymePair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPair, setCurrentPair] = useState<VietnameseRhymePair | null>(null);
  const [feedback, setFeedback] = useState<FeedbackStatus>(null);
  const [usedIndices, setUsedIndices] = useState<number[]>([]);
  
  const gameLogic = useGameLogic<IncorrectAttempt>({
    totalQuestions: TOTAL_QUESTIONS,
    timeLimit: TIME_LIMIT,
    onGameEnd,
    onCorrect,
    onStatusUpdate,
    lang: 'vi',
  });

  const { gameState, timeLeft, score, incorrectAttempts, isReviewing, handleCorrect, handleIncorrect, resetGame, setIsReviewing } = gameLogic;

  useEffect(() => {
    getVietnameseRhymes().then(data => {
        setAllPairs(data);
        setIsLoading(false);
    });
  }, []);

  const getNewPair = useCallback(() => {
    const pairList = allPairs.filter(p => p.difficulty === difficulty);
    if (pairList.length === 0) return;

    let availableIndices = pairList.map((_, i) => i).filter(i => !usedIndices.includes(i));
    if (availableIndices.length === 0 && pairList.length > 0) {
        setUsedIndices([]);
        availableIndices = pairList.map((_, i) => i);
    }
    
    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    const newPair = { ...pairList[randomIndex] };
    newPair.options = [...newPair.options].sort(() => Math.random() - 0.5);
    setCurrentPair(newPair);
    setUsedIndices(prev => [...prev.filter(i => i !== randomIndex), randomIndex]);
  }, [usedIndices, allPairs, difficulty]);
  
  const setupGame = useCallback(() => {
    resetGame();
    setUsedIndices([]);
    getNewPair();
  }, [resetGame, getNewPair]);

  useEffect(() => {
    if (!isLoading && allPairs.length > 0) {
        getNewPair();
    }
  }, [isLoading, allPairs, difficulty, gameLogic.currentQuestionIndex]);
  
  const handleOptionClick = (option: string) => {
    if (feedback || !currentPair) return;

    const isCorrect = option === currentPair.rhyme;
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    
    if (isCorrect) {
      playCorrectSound();
      setTimeout(() => {
          handleCorrect();
          setFeedback(null);
      }, 1000);
    } else {
      playEncouragementSound('vi');
      handleIncorrect({ pair: currentPair, selectedOption: option });
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  if (isLoading) return <div>Đang tải dữ liệu...</div>;

  if (gameState === 'finished') {
    if (isReviewing) {
        return (
            <ReviewMistakesScreen
                incorrectAttempts={incorrectAttempts}
                onBack={() => setIsReviewing(false)}
                renderAttempt={(attempt, index) => (
                    <div key={index} className="p-3 bg-red-100 rounded-lg text-left">
                        <p className="font-bold text-xl">Tìm vần cho từ: {attempt.pair.word}</p>
                        <p className="text-lg text-red-700">Bé chọn: {attempt.selectedOption}</p>
                        <p className="text-lg text-green-700">Đáp án đúng: {attempt.pair.rhyme}</p>
                    </div>
                )}
            />
        )
    }

    return (
        <GameEndScreen
          title={timeLeft > 0 ? "Hoàn thành!" : "Hết giờ!"}
          onReset={setupGame}
          onReview={() => setIsReviewing(true)}
          showReviewButton={incorrectAttempts.length > 0}
        >
          <p className="text-3xl">Bé đã trả lời đúng: <span className="font-bold text-blue-600">{score} / {TOTAL_QUESTIONS}</span> câu</p>
        </GameEndScreen>
    )
  }
  
  if (!currentPair) return <div>Đang tải...</div>;

  return (
    <div className="w-full flex flex-col items-center justify-center relative">
        <h3 className="text-3xl md:text-4xl font-bold mb-4 text-center">
            Từ nào có vần giống với từ...
        </h3>
        <div className="text-6xl font-bold mb-8 p-4 bg-yellow-200 border-4 border-yellow-400 rounded-xl shadow-md">
            {currentPair.word}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentPair.options.map((option) => (
                <button
                    key={option}
                    onClick={() => handleOptionClick(option)}
                    className="min-w-[150px] bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 px-8 text-3xl rounded-lg shadow-lg transition-transform transform hover:scale-105"
                >
                    {option}
                </button>
            ))}
        </div>
        <FeedbackIndicator status={feedback} />
    </div>
  );
};

export default VietnameseRhymeMatchLevel;