import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getVietnameseWords } from '../../utils/dataLoader';
import type { VietnameseWord } from '../../types';
import { playCorrectSound, playEncouragementSound } from '../../utils/sounds';
import FeedbackIndicator from '../FeedbackIndicator';
import { useGameLogic } from '../../hooks/useGameLogic';
import GameEndScreen from '../GameEndScreen';
import ReviewMistakesScreen from '../ReviewMistakesScreen';


interface IncorrectAttempt {
    word: VietnameseWord;
    incorrectInput: string;
}

interface VietnameseFillWordLevelProps {
  onCorrect: () => void;
  onStatusUpdate: (status: { timeLeft: number; currentQuestion: number; totalQuestions: number; }) => void;
  onGameEnd: () => void;
}

type FeedbackStatus = 'correct' | 'incorrect' | null;

const TOTAL_QUESTIONS = 5;
const TIME_LIMIT = 90; // 90 seconds

const VietnameseFillWordLevel: React.FC<VietnameseFillWordLevelProps> = ({ onCorrect, onStatusUpdate, onGameEnd }) => {
  const [wordList, setWordList] = useState<VietnameseWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWord, setCurrentWord] = useState<VietnameseWord | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<FeedbackStatus>(null);
  const [usedIndices, setUsedIndices] = useState<number[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);

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
    getVietnameseWords().then(data => {
      setWordList(data);
      setIsLoading(false);
    });
  }, []);

  const getNewWord = useCallback(() => {
    if (wordList.length === 0) return;
    
    let availableIndices = wordList.map((_, i) => i).filter(i => !usedIndices.includes(i));
    if (availableIndices.length === 0 && wordList.length > 0) {
        // Reset if we've used all words
        setUsedIndices([]);
        availableIndices = wordList.map((_, i) => i);
    }
    
    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    const newWord = wordList[randomIndex];
    setCurrentWord(newWord);
    setInputValue('');
    setUsedIndices(prev => [...prev.filter(i => i !== randomIndex), randomIndex]);
  }, [usedIndices, wordList]);
  
  const setupGame = useCallback(() => {
    resetGame();
    setUsedIndices([]);
    getNewWord();
  }, [resetGame, getNewWord]);


  useEffect(() => {
    if (!isLoading && wordList.length > 0) {
      getNewWord();
    }
  }, [isLoading, wordList, gameLogic.currentQuestionIndex]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [currentWord]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback || !currentWord) return;
    
    const isCorrect = inputValue.trim().toLowerCase() === currentWord.missing.toLowerCase();
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      playCorrectSound();
      setTimeout(() => {
        handleCorrect();
        setFeedback(null);
      }, 1000);
    } else {
      playEncouragementSound('vi');
      handleIncorrect({ word: currentWord, incorrectInput: inputValue });
       setTimeout(() => {
        setFeedback(null);
      }, 1000);
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
                        <p className="font-bold text-xl">{attempt.word.sentence.replace('__', `[${attempt.word.missing}]`)}</p>
                        <p className="text-lg text-red-700">Bé điền: {attempt.incorrectInput || "(bỏ trống)"}</p>
                        <p className="text-lg text-green-700">Đáp án đúng: {attempt.word.missing}</p>
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