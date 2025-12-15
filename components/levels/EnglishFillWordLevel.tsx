
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getEnglishWords } from '../../utils/dataLoader.ts';
import type { EnglishWord, Difficulty } from '../../types.ts';
import { playCorrectSound, playEncouragementSound, playVictorySound } from '../../utils/sounds.ts';
import FeedbackIndicator from '../FeedbackIndicator.tsx';

interface IncorrectAttempt {
    word: EnglishWord;
    incorrectInput: string;
}

interface EnglishFillWordLevelProps {
  difficulty: Difficulty;
  onCorrect: () => void;
  onStatusUpdate: (status: { timeLeft: number; currentQuestion: number; totalQuestions: number; }) => void;
  onGameEnd: () => void;
}

type FeedbackStatus = 'correct' | 'incorrect' | null;
type GameState = 'playing' | 'finished';

const TOTAL_QUESTIONS = 5;
const TIME_LIMIT = 90;

const EnglishFillWordLevel: React.FC<EnglishFillWordLevelProps> = ({ difficulty, onCorrect, onStatusUpdate, onGameEnd }) => {
  const [allWords, setAllWords] = useState<EnglishWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWord, setCurrentWord] = useState<EnglishWord | null>(null);
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
    getEnglishWords().then(data => {
        setAllWords(data);
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
    const wordList = allWords.filter(w => w.difficulty === difficulty);
    if (wordList.length === 0) return;
    
    let availableIndices = wordList.map((_, i) => i).filter(i => !usedIndices.includes(i));
    if (availableIndices.length === 0 && wordList.length > 0) {
        const newRandomIndex = Math.floor(Math.random() * wordList.length);
        setCurrentWord(wordList[newRandomIndex]);
        setInputValue('');
        setUsedIndices([newRandomIndex]);
    } else if (availableIndices.length > 0) {
        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        setCurrentWord(wordList[randomIndex]);
        setInputValue('');
        setUsedIndices(prev => [...prev, randomIndex]);
    }
  }, [usedIndices, allWords, difficulty]);

  const handleGameFinish = useCallback(() => {
    setGameState('finished');
    cleanupTimer();
    if (!gameEndedRef.current) {
      onGameEnd();
      gameEndedRef.current = true;
    }
  }, [cleanupTimer, onGameEnd]);

  const setupGame = useCallback(() => {
    const wordList = allWords.filter(w => w.difficulty === difficulty);
    if (wordList.length === 0) return;
        
    const firstRandomIndex = Math.floor(Math.random() * wordList.length);
    setCurrentWord(wordList[firstRandomIndex]);
    setInputValue('');
    setUsedIndices([firstRandomIndex]);

    if (timerRef.current) cleanupTimer();
    gameEndedRef.current = false;
    timerRef.current = window.setInterval(() => setTimeLeft(prev => prev - 1), 1000);
  }, [allWords, difficulty, cleanupTimer]);

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
            playVictorySound('en');
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
      playEncouragementSound('en');
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

  if (isLoading) return <div>Loading data...</div>;

  if (gameState === 'finished') {
    if (isReviewing) {
        return (
            <div className="w-full text-center">
                <h3 className="text-3xl font-bold text-rose-500 mb-4">Review Mistakes</h3>
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                    {incorrectAttempts.map((attempt, index) => (
                        <div key={index} className="p-3 bg-red-100 rounded-lg text-left">
                            <p className="font-bold text-xl">{attempt.word.sentence.replace('__', `[${attempt.word.missing}]`)}</p>
                            <p className="text-lg text-red-700">You typed: {attempt.incorrectInput || "(empty)"}</p>
                        </div>
                    ))}
                </div>
                <button
                    onClick={() => setIsReviewing(false)}
                    className="mt-6 bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-6 text-xl rounded-full shadow-lg"
                >
                    Back
                </button>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center gap-4 text-center">
            <h3 className="text-5xl font-bold text-rose-500">{timeLeft > 0 ? "Complete!" : "Time's up!"}</h3>
            <p className="text-3xl">You answered: <span className="font-bold text-blue-600">{score} / {TOTAL_QUESTIONS}</span></p>
            <div className="flex gap-4 mt-4">
                <button
                    onClick={resetGame}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 text-2xl rounded-full shadow-lg transition-transform transform hover:scale-105"
                >
                    Play Again
                </button>
                {incorrectAttempts.length > 0 && (
                    <button
                        onClick={() => setIsReviewing(true)}
                        className="bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 px-8 text-2xl rounded-full shadow-lg transition-transform transform hover:scale-105"
                    >
                        Review Mistakes
                    </button>
                )}
            </div>
        </div>
    )
  }

  if (!currentWord) return <div>Loading word...</div>;
  
  const sentenceParts = currentWord.sentence.split('__');

  return (
    <div className="w-full flex flex-col items-center justify-center relative">
        <div className="text-9xl mb-6 h-40 flex items-center justify-center">{currentWord.image}</div>
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
            <div className="flex items-center gap-2 bg-white p-4 rounded-2xl border-4 border-orange-300">
                <span className="text-4xl md:text-5xl font-bold">{sentenceParts[0]}</span>
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-24 md:w-32 h-16 text-center text-4xl md:text-5xl font-bold text-orange-600 bg-orange-100 border-2 border-orange-400 rounded-lg focus:outline-none focus:ring-4 focus:ring-yellow-300"
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
                className="mt-6 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-10 text-2xl rounded-full shadow-lg transition-transform transform hover:scale-105"
            >
                Check
            </button>
        </form>
        <FeedbackIndicator status={feedback} />
    </div>
  );
};

export default EnglishFillWordLevel;
