
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getVietnameseWords } from '../../utils/dataLoader';
import type { VietnameseWord, Difficulty } from '../../types';
import { playCorrectSound, playEncouragementSound, playVictorySound } from '../../utils/sounds';
import FeedbackIndicator from '../FeedbackIndicator';

interface IncorrectAttempt {
    word: VietnameseWord;
    incorrectInput: string;
}

interface VietnameseFillWordLevelProps {
  difficulty: Difficulty;
  onCorrect: () => void;
  onStatusUpdate: (status: { timeLeft: number; currentQuestion: number; totalQuestions: number; }) => void;
  onGameEnd: () => void;
}

type FeedbackStatus = 'correct' | 'incorrect' | null;
type GameState = 'playing' | 'finished';

const TOTAL_QUESTIONS = 5;
const TIME_LIMIT = 90; // 90 seconds

const VietnameseFillWordLevel: React.FC<VietnameseFillWordLevelProps> = ({ onCorrect, onStatusUpdate, onGameEnd }) => {
  const [wordList, setWordList] = useState<VietnameseWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWord, setCurrentWord] = useState<VietnameseWord | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<FeedbackStatus>(null);
  const [usedIndices, setUsedIndices] = useState<number[]>([]);
  
  const [gameState, setGameState] = useState<GameState>('playing');
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [incorrectAttempts, setIncorrectAttempts] = useState<IncorrectAttempt[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  const gameEndedRef = useRef(false);
  
  useEffect(() => {
    getVietnameseWords().then(data => {
      setWordList(data);
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

  const getNewWord = useCallback(() => {
    if (wordList.length === 0) return;
    
    let availableIndices = wordList.map((_, i) => i).filter(i => !usedIndices.includes(i));
    if (availableIndices.length === 0 && wordList.length > 0) {
        // Reset if we've used all words
        const newRandomIndex = Math.floor(Math.random() * wordList.length);
        setCurrentWord(wordList[newRandomIndex]);
        setInputValue('');
        setUsedIndices([newRandomIndex]);
    } else {
        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        setUsedIndices(prev => [...prev, randomIndex]);
        setCurrentWord(wordList[randomIndex]);
        setInputValue('');
    }
  }, [usedIndices, wordList]);
  
  const handleGameFinish = useCallback(() => {
    setGameState('finished');
    cleanupTimer();
    if (!gameEndedRef.current) {
      onGameEnd();
      gameEndedRef.current = true;
    }
  }, [cleanupTimer, onGameEnd]);

  const setupGame = useCallback(() => {
    if (wordList.length === 0) return;
    
    const firstRandomIndex = Math.floor(Math.random() * wordList.length);
    setCurrentWord(wordList[firstRandomIndex]);
    setInputValue('');
    setUsedIndices([firstRandomIndex]);
    
    if (timerRef.current) cleanupTimer();
    gameEndedRef.current = false;
    timerRef.current = window.setInterval(() => setTimeLeft(prev => prev - 1), 1000);
  }, [wordList, cleanupTimer]);

  useEffect(() => {
    if (!isLoading) {
      setupGame();
    }
    return cleanupTimer;
  }, [isLoading, setupGame]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [currentWord]);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleGameFinish();
    }
  }, [timeLeft, handleGameFinish]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback) return;

    const proceedToNext = () => {
        if (currentQuestionIndex < TOTAL_QUESTIONS - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            getNewWord();
            setFeedback(null);
        } else {
            playVictorySound('vi');
            handleGameFinish();
        }
    };

    if (currentWord && inputValue.trim().toLowerCase() === currentWord.missing.toLowerCase()) {
      playCorrectSound();
      setFeedback('correct');
      onCorrect();
      setScore(prev => prev + 1);
      setTimeout(proceedToNext, 1000);
    } else {
      playEncouragementSound('vi');
      setFeedback('incorrect');
      if (currentWord) {
        setIncorrectAttempts(prev => [...prev, { word: currentWord, incorrectInput: inputValue }]);
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
                            <p className="font-bold text-xl">{attempt.word.sentence.replace('__', `[${attempt.word.missing}]`)}</p>
                            <p className="text-lg text-red-700">Bé điền: {attempt.incorrectInput || "(bỏ trống)"}</p>
                            <p className="text-lg text-green-700">Đáp án đúng: {attempt.word.missing}</p>
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

  if (!currentWord) return <div>Đang tải từ vựng...</div>;
  
  const sentenceParts = currentWord.sentence.split('__');

  return (
    <div className="w-full flex flex-col items-center justify-center relative">
        <div className="text-9xl mb-6 h-40 flex items-center justify-center">{currentWord.image}</div>
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
            <div className="flex items-center gap-2 bg-white p-4 rounded-2xl border-4 border-rose-300">
                <span className="text-4xl md:text-5xl font-bold">{sentenceParts[0]}</span>
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-24 md:w-32 h-16 text-center text-4xl md:text-5xl font-bold text-rose-600 bg-rose-100 border-2 border-rose-400 rounded-lg focus:outline-none focus:ring-4 focus:ring-yellow-300"
                    maxLength={currentWord.missing.length}
                    autoCapitalize="none"
                    autoComplete="off"
                    autoCorrect="off"
                />
                <span className="text-4xl md:text-5xl font-bold">{sentenceParts[1]}</span>
            </div>
             <button 
                type="submit" 
                onClick={handleSubmit} 
                className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-10 text-2xl rounded-full shadow-lg transition-transform transform hover:scale-105"
            >
                Kiểm tra
            </button>
        </form>
        <FeedbackIndicator status={feedback} />
    </div>
  );
};

export default VietnameseFillWordLevel;
