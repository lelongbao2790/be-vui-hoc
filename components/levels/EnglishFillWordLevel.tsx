import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getEnglishWords } from '../../utils/dataLoader';
import type { EnglishWord, Difficulty } from '../../types';
import { playCorrectSound, playEncouragementSound } from '../../utils/sounds';
import FeedbackIndicator from '../FeedbackIndicator';
import { useGameLogic } from '../../hooks/useGameLogic';
import GameEndScreen from '../GameEndScreen';
import ReviewMistakesScreen from '../ReviewMistakesScreen';

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

const TOTAL_QUESTIONS = 5;
const TIME_LIMIT = 90;

const EnglishFillWordLevel: React.FC<EnglishFillWordLevelProps> = ({ difficulty, onCorrect, onStatusUpdate, onGameEnd }) => {
  const [allWords, setAllWords] = useState<EnglishWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWord, setCurrentWord] = useState<EnglishWord | null>(null);
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
    lang: 'en',
  });

  const { gameState, timeLeft, score, incorrectAttempts, isReviewing, handleCorrect, handleIncorrect, resetGame, setIsReviewing } = gameLogic;


  useEffect(() => {
    getEnglishWords().then(data => {
        setAllWords(data);
        setIsLoading(false);
    });
  }, []);

  const getNewWord = useCallback(() => {
    const wordList = allWords.filter(w => w.difficulty === difficulty);
    if (wordList.length === 0) return;
    
    let availableIndices = wordList.map((_, i) => i).filter(i => !usedIndices.includes(i));
    if (availableIndices.length === 0 && wordList.length > 0) {
        setUsedIndices([]); // Reset if all used
        availableIndices = wordList.map((_, i) => i);
    }
    
    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    const newWord = wordList[randomIndex];

    setCurrentWord(newWord);
    setInputValue('');
    setUsedIndices(prev => [...prev.filter(i => i !== randomIndex), randomIndex]);

  }, [usedIndices, allWords, difficulty]);
  
  const setupGame = useCallback(() => {
    resetGame();
    setUsedIndices([]);
    getNewWord();
  }, [resetGame, getNewWord]);

  useEffect(() => {
    if (!isLoading && allWords.length > 0) {
        getNewWord();
    }
  }, [isLoading, allWords, gameLogic.currentQuestionIndex]);

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
      playEncouragementSound('en');
      handleIncorrect({ word: currentWord, incorrectInput: inputValue });
      setTimeout(() => setFeedback(null), 1000);
    }
  };
  
  if (isLoading) return <div>Loading data...</div>;

  if (gameState === 'finished') {
    if (isReviewing) {
        return (
            <ReviewMistakesScreen
                title="Review Mistakes"
                incorrectAttempts={incorrectAttempts}
                onBack={() => setIsReviewing(false)}
                renderAttempt={(attempt, index) => (
                     <div key={index} className="p-3 bg-red-100 rounded-lg text-left">
                        <p className="font-bold text-xl">{attempt.word.sentence.replace('__', `[${attempt.word.missing}]`)}</p>
                        <p className="text-lg text-red-700">You typed: {attempt.incorrectInput || "(empty)"}</p>
                    </div>
                )}
            />
        )
    }

    return (
        <GameEndScreen
            title={timeLeft > 0 ? "Complete!" : "Time's up!"}
            onReset={setupGame}
            onReview={() => setIsReviewing(true)}
            showReviewButton={incorrectAttempts.length > 0}
        >
             <p className="text-3xl">You answered: <span className="font-bold text-blue-600">{score} / {TOTAL_QUESTIONS}</span></p>
        </GameEndScreen>
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