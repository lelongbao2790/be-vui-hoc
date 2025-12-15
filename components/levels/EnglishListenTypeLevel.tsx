import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getEnglishWords } from '../../utils/dataLoader.ts';
import type { EnglishWord, Difficulty } from '../../types.ts';
import { playCorrectSound, playEncouragementSound, speakText } from '../../utils/sounds.ts';
import FeedbackIndicator from '../FeedbackIndicator.tsx';
import { ListenIcon } from '../icons/ListenIcon.tsx';
import { useGameLogic } from '../../hooks/useGameLogic.ts';
import GameEndScreen from '../GameEndScreen.tsx';
import ReviewMistakesScreen from '../ReviewMistakesScreen.tsx';

interface IncorrectAttempt {
    word: EnglishWord;
    incorrectInput: string;
}

interface EnglishListenTypeLevelProps {
  difficulty: Difficulty;
  onCorrect: () => void;
  onStatusUpdate: (status: { timeLeft: number; currentQuestion: number; totalQuestions: number; }) => void;
  onGameEnd: () => void;
  onGoToMenu: () => void;
}

type FeedbackStatus = 'correct' | 'incorrect' | null;

const TOTAL_QUESTIONS = 5;
const TIME_LIMIT = 100;

const EnglishListenTypeLevel: React.FC<EnglishListenTypeLevelProps> = ({ difficulty, onCorrect, onStatusUpdate, onGameEnd, onGoToMenu }) => {
  const [allWords, setAllWords] = useState<EnglishWord[]>([]);
  const [questionDeck, setQuestionDeck] = useState<EnglishWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWord, setCurrentWord] = useState<EnglishWord | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<FeedbackStatus>(null);
  
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
        const filtered = data.filter(w => w.difficulty === difficulty);
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        setQuestionDeck(shuffled);
        setIsLoading(false);
    });
  }, [difficulty]);

  const getNewWord = useCallback(() => {
    let nextWord: EnglishWord;

    if (questionDeck.length === 0) {
        const filtered = allWords.filter(w => w.difficulty === difficulty);
        if (filtered.length === 0) return;
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        nextWord = shuffled[0];
        setQuestionDeck(shuffled.slice(1));
    } else {
        nextWord = questionDeck[0];
        setQuestionDeck(prev => prev.slice(1));
    }

    setCurrentWord(nextWord);
    setInputValue('');
  }, [questionDeck, allWords, difficulty]);
  
  const setupGame = useCallback(() => {
    resetGame();
    if (!isLoading) {
        getNewWord();
    }
  }, [resetGame, getNewWord, isLoading]);

  useEffect(() => {
    if (!isLoading && allWords.length > 0 && !currentWord) {
        getNewWord();
    }
  }, [isLoading, allWords, currentWord, getNewWord]);

  useEffect(() => {
      if (gameLogic.currentQuestionIndex > 0 && gameState === 'playing') {
          getNewWord();
      }
  }, [gameLogic.currentQuestionIndex, gameState]);


  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [currentWord]);

  const handleListen = useCallback(() => {
    if (currentWord) {
        speakText(currentWord.word, 'en');
    }
  }, [currentWord]);

  useEffect(() => {
      handleListen();
  }, [handleListen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback || !currentWord) return;

    const isCorrect = inputValue.trim().toLowerCase() === currentWord.word.toLowerCase();
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
                renderAttempt={(attempt: IncorrectAttempt, index) => (
                    <div key={index} className="p-3 bg-red-100 rounded-lg text-left">
                        <p className="font-bold text-xl">Correct word: <span className="text-green-700">{attempt.word.word}</span></p>
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
            onGoToMenu={onGoToMenu}
            onReview={() => setIsReviewing(true)}
            showReviewButton={incorrectAttempts.length > 0}
        >
             <p className="text-3xl">You answered: <span className="font-bold text-blue-600">{score} / {TOTAL_QUESTIONS}</span></p>
        </GameEndScreen>
    )
  }

  if (!currentWord) return <div>Loading word...</div>;

  return (
    <div className="w-full flex flex-col items-center justify-center relative">
        <div className="text-9xl mb-6 h-40 flex items-center justify-center">{currentWord.image}</div>
        
        <div className="flex items-center gap-4 mb-6">
            <button
                onClick={handleListen}
                className="bg-sky-500 hover:bg-sky-600 text-white p-4 rounded-full shadow-lg transition-transform transform hover:scale-110"
                aria-label="Nghe lại"
            >
                <ListenIcon className="w-10 h-10" />
            </button>
            <p className="text-2xl text-slate-600">Click the speaker to listen</p>
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-64 h-16 text-center text-4xl font-bold text-orange-600 bg-orange-100 border-2 border-orange-400 rounded-lg focus:outline-none focus:ring-4 focus:ring-yellow-300"
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
                placeholder="Type the word"
            />
        </form>
         <button 
            type="submit" 
            onClick={handleSubmit} 
            className="mt-6 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-10 text-2xl rounded-full shadow-lg transition-transform transform hover:scale-105"
        >
            Check
        </button>
        <FeedbackIndicator status={feedback} />
    </div>
  );
};

export default EnglishListenTypeLevel;