import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getEnglishSentences } from '../../utils/dataLoader.ts';
import type { EnglishSentence, Difficulty } from '../../types.ts';
import { playCorrectSound, playEncouragementSound, speakText } from '../../utils/sounds.ts';
import FeedbackIndicator from '../FeedbackIndicator.tsx';
import { ListenIcon } from '../icons/ListenIcon.tsx';
import { useGameLogic } from '../../hooks/useGameLogic.ts';
import GameEndScreen from '../GameEndScreen.tsx';
import ReviewMistakesScreen from '../ReviewMistakesScreen.tsx';


interface IncorrectAttempt {
    sentence: EnglishSentence;
    incorrectInput: string;
}

interface EnglishListenFillSentenceLevelProps {
  difficulty: Difficulty;
  onCorrect: () => void;
  onStatusUpdate: (status: { timeLeft: number; currentQuestion: number; totalQuestions: number; }) => void;
  onGameEnd: () => void;
  onGoToMenu: () => void;
}

type FeedbackStatus = 'correct' | 'incorrect' | null;

const TOTAL_QUESTIONS = 5;
const TIME_LIMIT = 120;

const EnglishListenFillSentenceLevel: React.FC<EnglishListenFillSentenceLevelProps> = ({ difficulty, onCorrect, onStatusUpdate, onGameEnd, onGoToMenu }) => {
  const [allSentences, setAllSentences] = useState<EnglishSentence[]>([]);
  const [questionDeck, setQuestionDeck] = useState<EnglishSentence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSentence, setCurrentSentence] = useState<EnglishSentence | null>(null);
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
    getEnglishSentences().then(data => {
        setAllSentences(data);
        const filtered = data.filter(s => s.difficulty === difficulty);
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        setQuestionDeck(shuffled);
        setIsLoading(false);
    });
  }, [difficulty]);

  const getNewSentence = useCallback(() => {
    let nextSentence: EnglishSentence;

    if (questionDeck.length === 0) {
        const filtered = allSentences.filter(s => s.difficulty === difficulty);
        if (filtered.length === 0) return;
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        nextSentence = shuffled[0];
        setQuestionDeck(shuffled.slice(1));
    } else {
        nextSentence = questionDeck[0];
        setQuestionDeck(prev => prev.slice(1));
    }

    setCurrentSentence(nextSentence);
    setInputValue('');
    
  }, [questionDeck, allSentences, difficulty]);
  
  const setupGame = useCallback(() => {
    resetGame();
    if (!isLoading) {
        getNewSentence();
    }
  }, [resetGame, getNewSentence, isLoading]);

  useEffect(() => {
    if (!isLoading && allSentences.length > 0 && !currentSentence) {
        getNewSentence();
    }
  }, [isLoading, allSentences, currentSentence, getNewSentence]);

  useEffect(() => {
      if (gameLogic.currentQuestionIndex > 0 && gameState === 'playing') {
          getNewSentence();
      }
  }, [gameLogic.currentQuestionIndex, gameState]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [currentSentence]);

  const handleListen = useCallback(() => {
    if (currentSentence) {
        const fullSentence = currentSentence.sentence.replace('__', currentSentence.missing);
        speakText(fullSentence, 'en');
    }
  }, [currentSentence]);
  
  useEffect(() => {
    handleListen();
  }, [handleListen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback || !currentSentence) return;
    
    const isCorrect = inputValue.trim().toLowerCase() === currentSentence.missing.toLowerCase();
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      playCorrectSound();
      setTimeout(() => {
        handleCorrect();
        setFeedback(null);
      }, 1000);
    } else {
      playEncouragementSound('en');
      handleIncorrect({ sentence: currentSentence, incorrectInput: inputValue });
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
                        <p className="font-bold text-xl">{attempt.sentence.sentence.replace('__', `[${attempt.sentence.missing}]`)}</p>
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

  if (!currentSentence) return <div>Loading sentence...</div>;

  const sentenceParts = currentSentence.sentence.split('__');

  return (
    <div className="w-full flex flex-col items-center justify-center relative">
        <div className="text-9xl mb-6 h-40 flex items-center justify-center">{currentSentence.image}</div>
        <div className="flex items-center gap-4 mb-6">
            <button
                onClick={handleListen}
                className="bg-sky-500 hover:bg-sky-600 text-white p-4 rounded-full shadow-lg transition-transform transform hover:scale-110"
                aria-label="Listen again"
            >
                <ListenIcon className="w-10 h-10" />
            </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
            <div className="flex items-center flex-wrap justify-center gap-2 bg-white p-4 rounded-2xl border-4 border-orange-300">
                <span className="text-3xl md:text-4xl font-bold">{sentenceParts[0]}</span>
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-40 md:w-56 h-16 text-center text-3xl md:text-4xl font-bold text-orange-600 bg-orange-100 border-2 border-orange-400 rounded-lg focus:outline-none focus:ring-4 focus:ring-yellow-300"
                    maxLength={currentSentence.missing.length + 3}
                    autoCapitalize="none"
                    autoComplete="off"
                    autoCorrect="off"
                />
                <span className="text-3xl md:text-4xl font-bold">{sentenceParts[1]}</span>
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

export default EnglishListenFillSentenceLevel;