
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getVietnameseRhymes } from '../../utils/dataLoader';
import type { VietnameseRhymePair, Difficulty } from '../../types';
import { playCorrectSound, playEncouragementSound, playVictorySound } from '../../utils/sounds';
import FeedbackIndicator from '../FeedbackIndicator';

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
type GameState = 'playing' | 'finished';

const TOTAL_QUESTIONS = 5;
const TIME_LIMIT = 90;

const VietnameseRhymeMatchLevel: React.FC<VietnameseRhymeMatchLevelProps> = ({ difficulty, onCorrect, onStatusUpdate, onGameEnd }) => {
  const [allPairs, setAllPairs] = useState<VietnameseRhymePair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPair, setCurrentPair] = useState<VietnameseRhymePair | null>(null);
  const [feedback, setFeedback] = useState<FeedbackStatus>(null);
  const [usedIndices, setUsedIndices] = useState<number[]>([]);
  
  const [gameState, setGameState] = useState<GameState>('playing');
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [incorrectAttempts, setIncorrectAttempts] = useState<IncorrectAttempt[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);

  const timerRef = useRef<number | null>(null);
  const gameEndedRef = useRef(false);

  useEffect(() => {
    getVietnameseRhymes().then(data => {
        setAllPairs(data);
        setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    onStatusUpdate({ timeLeft, currentQuestion: currentQuestionIndex + 1, totalQuestions: TOTAL_QUESTIONS });
  }, [timeLeft, currentQuestionIndex, onStatusUpdate]);

  const cleanupTimer = useCallback(() => {
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }
  }, []);

  const getNewPair = useCallback(() => {
    const pairList = allPairs.filter(p => p.difficulty === difficulty);
    if (pairList.length === 0) return;

    let availableIndices = pairList.map((_, i) => i).filter(i => !usedIndices.includes(i));
    if (availableIndices.length === 0 && pairList.length > 0) {
        const newRandomIndex = Math.floor(Math.random() * pairList.length);
        const newPair = { ...pairList[newRandomIndex] };
        newPair.options = [...newPair.options].sort(() => Math.random() - 0.5);
        setCurrentPair(newPair);
        setUsedIndices([newRandomIndex]);
    } else if (availableIndices.length > 0) {
        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        const newPair = { ...pairList[randomIndex] };
        newPair.options = [...newPair.options].sort(() => Math.random() - 0.5);
        setCurrentPair(newPair);
        setUsedIndices(prev => [...prev, randomIndex]);
    }
  }, [usedIndices, allPairs, difficulty]);

  const handleGameFinish = useCallback(() => {
    setGameState('finished');
    cleanupTimer();
    if (!gameEndedRef.current) {
      onGameEnd();
      gameEndedRef.current = true;
    }
  }, [cleanupTimer, onGameEnd]);

  const setupGame = useCallback(() => {
    const pairList = allPairs.filter(p => p.difficulty === difficulty);
    if (pairList.length === 0) return;

    const firstRandomIndex = Math.floor(Math.random() * pairList.length);
    const firstPair = { ...pairList[firstRandomIndex] };
    firstPair.options = [...firstPair.options].sort(() => Math.random() - 0.5);
    setCurrentPair(firstPair);
    setUsedIndices([firstRandomIndex]);

    if (timerRef.current) cleanupTimer();
    gameEndedRef.current = false;
    timerRef.current = window.setInterval(() => setTimeLeft(prev => prev - 1), 1000);
  }, [allPairs, difficulty, cleanupTimer]);

  useEffect(() => {
    if (!isLoading) {
        setupGame();
    }
    return cleanupTimer;
  }, [isLoading, setupGame]);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleGameFinish();
    }
  }, [timeLeft, handleGameFinish]);
  
  const handleOptionClick = (option: string) => {
    if (feedback) return;

    const proceedToNext = () => {
        if (currentQuestionIndex < TOTAL_QUESTIONS - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            getNewPair();
            setFeedback(null);
        } else {
            playVictorySound('vi');
            handleGameFinish();
        }
    };

    if (currentPair && option === currentPair.rhyme) {
      playCorrectSound();
      setFeedback('correct');
      onCorrect();
      setScore(prev => prev + 1);
      setTimeout(proceedToNext, 1000);
    } else {
      playEncouragementSound('vi');
      setFeedback('incorrect');
      if (currentPair) {
        setIncorrectAttempts(prev => [...prev, { pair: currentPair, selectedOption: option }]);
      }
      setTimeout(proceedToNext, 1000);
    }
  };

  const resetGame = () => {
    setTimeLeft(TIME_LIMIT);
    setCurrentQuestionIndex(0);
    setScore(0);
    setIncorrectAttempts([]);
    setIsReviewing(false);
    setGameState('playing');
    setupGame();
  };

  if (isLoading) return <div>Đang tải dữ liệu...</div>;

  if (gameState === 'finished') {
    if (isReviewing) {
        return (
            <div className="w-full text-center">
                <h3 className="text-3xl font-bold text-rose-500 mb-4">Xem Lại Lỗi Sai</h3>
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                    {incorrectAttempts.map((attempt, index) => (
                        <div key={index} className="p-3 bg-red-100 rounded-lg text-left">
                            <p className="font-bold text-xl">Tìm vần cho từ: {attempt.pair.word}</p>
                            <p className="text-lg text-red-700">Bé chọn: {attempt.selectedOption}</p>
                            <p className="text-lg text-green-700">Đáp án đúng: {attempt.pair.rhyme}</p>
                        </div>
                    ))}
                </div>
                <button
                    onClick={() => setIsReviewing(false)}
                    className="mt-6 bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-6 text-xl rounded-full shadow-lg"
                >
                    Quay lại
                </button>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center gap-4 text-center">
            <h3 className="text-5xl font-bold text-rose-500">{timeLeft > 0 ? "Hoàn thành!" : "Hết giờ!"}</h3>
            <p className="text-3xl">Bé đã trả lời đúng: <span className="font-bold text-blue-600">{score} / {TOTAL_QUESTIONS}</span> câu</p>
             <div className="flex gap-4 mt-4">
                <button
                    onClick={resetGame}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 text-2xl rounded-full shadow-lg transition-transform transform hover:scale-105"
                >
                    Chơi lại
                </button>
                {incorrectAttempts.length > 0 && (
                     <button
                        onClick={() => setIsReviewing(true)}
                        className="bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 px-8 text-2xl rounded-full shadow-lg transition-transform transform hover:scale-105"
                    >
                        Xem Lại Lỗi Sai
                    </button>
                )}
            </div>
        </div>
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
