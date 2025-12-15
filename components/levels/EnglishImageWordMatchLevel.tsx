
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getEnglishWords } from '../../utils/dataLoader.ts';
import type { EnglishWord, Difficulty } from '../../types.ts';
import { playCorrectSound, playEncouragementSound, playVictorySound, speakText } from '../../utils/sounds.ts';
import FeedbackIndicator from '../FeedbackIndicator.tsx';

interface IncorrectAttempt {
    word: EnglishWord;
    selectedOption: string;
}

interface EnglishImageWordMatchLevelProps {
  difficulty: Difficulty;
  onCorrect: () => void;
  onStatusUpdate: (status: { timeLeft: number; currentQuestion: number; totalQuestions: number; }) => void;
  onGameEnd: () => void;
}

type FeedbackStatus = 'correct' | 'incorrect' | null;
type GameState = 'playing' | 'finished';

const TOTAL_QUESTIONS = 5;
const TIME_LIMIT = 90;

const EnglishImageWordMatchLevel: React.FC<EnglishImageWordMatchLevelProps> = ({ difficulty, onCorrect, onStatusUpdate, onGameEnd }) => {
  const [allWords, setAllWords] = useState<EnglishWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWord, setCurrentWord] = useState<EnglishWord | null>(null);
  const [options, setOptions] = useState<string[]>([]);
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

  const getNewChallenge = useCallback(() => {
    const wordList = allWords.filter(w => w.difficulty === difficulty);
    if (wordList.length < 3) return;

    let availableIndices = wordList.map((_, i) => i).filter(i => !usedIndices.includes(i));
    if (availableIndices.length === 0 && wordList.length > 0) {
        setUsedIndices([]);
        availableIndices = wordList.map((_, i) => i);
    }
    
    if (availableIndices.length > 0) {
        const correctIndexInList = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        const correctWord = wordList[correctIndexInList];
        setCurrentWord(correctWord);
        setUsedIndices(prev => [...prev.filter(i => i !== correctIndexInList), correctIndexInList]);

        const wrongOptions = new Set<string>();
        while (wrongOptions.size < 2) {
            const wrongIndex = Math.floor(Math.random() * wordList.length);
            if (wrongIndex !== correctIndexInList) {
                wrongOptions.add(wordList[wrongIndex].word);
            }
        }
        
        const allOptions = [correctWord.word, ...Array.from(wrongOptions)].sort(() => Math.random() - 0.5);
        setOptions(allOptions);
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
    if (wordList.length < 3) return;

    const firstRandomIndex = Math.floor(Math.random() * wordList.length);
    const correctWord = wordList[firstRandomIndex];
    setCurrentWord(correctWord);
    setUsedIndices([firstRandomIndex]);

    const wrongOptions = new Set<string>();
    while (wrongOptions.size < 2) {
      const wrongIndex = Math.floor(Math.random() * wordList.length);
      if (wrongIndex !== firstRandomIndex) {
        wrongOptions.add(wordList[wrongIndex].word);
      }
    }
    
    const allOptions = [correctWord.word, ...Array.from(wrongOptions)].sort(() => Math.random() - 0.5);
    setOptions(allOptions);

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
    if (timeLeft <= 0) {
      handleGameFinish();
    }
  }, [timeLeft, handleGameFinish]);
  
  const handleOptionClick = (option: string) => {
    if (feedback) return;

    speakText(option, 'en');

    const proceedToNext = () => {
        if (currentQuestionIndex < TOTAL_QUESTIONS - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            getNewChallenge();
            setFeedback(null);
        } else {
            playVictorySound('en');
            handleGameFinish();
        }
    };

    if (currentWord && option === currentWord.word) {
      playCorrectSound();
      setFeedback('correct');
      onCorrect();
      setScore(prev => prev + 1);
      setTimeout(proceedToNext, 1000);
    } else {
      playEncouragementSound('en');
      setFeedback('incorrect');
      if (currentWord) {
        setIncorrectAttempts(prev => [...prev, { word: currentWord, selectedOption: option }]);
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
                            <p className="font-bold text-xl">Image: {attempt.word.image}</p>
                            <p className="text-lg text-red-700">You chose: {attempt.selectedOption}</p>
                            <p className="text-lg text-green-700">Correct answer: {attempt.word.word}</p>
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
  
  if (!currentWord) return <div>Loading...</div>;

  return (
    <div className="w-full flex flex-col items-center justify-center relative">
        <h3 className="text-3xl md:text-4xl font-bold mb-4 text-center">
            What is this?
        </h3>
        <div className="text-9xl mb-6 h-40 flex items-center justify-center">{currentWord.image}</div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {options.map((option) => (
                <button
                    key={option}
                    onClick={() => handleOptionClick(option)}
                    className="min-w-[150px] bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-8 text-3xl rounded-lg shadow-lg transition-transform transform hover:scale-105"
                >
                    {option}
                </button>
            ))}
        </div>
        <FeedbackIndicator status={feedback} />
    </div>
  );
};

export default EnglishImageWordMatchLevel;
