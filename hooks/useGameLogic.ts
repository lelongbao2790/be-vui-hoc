import { useState, useCallback, useRef, useEffect } from 'react';
import { playVictorySound } from '../utils/sounds';
import { logger } from '../utils/logger';

interface GameLogicParams {
  timeLimit: number;
  totalQuestions: number;
  onGameEnd: () => void;
  onCorrect: () => void;
  onStatusUpdate: (status: any) => void;
  lang: 'vi' | 'en';
}

export const useGameLogic = <T>({ timeLimit, totalQuestions, onGameEnd, onCorrect, onStatusUpdate, lang }: GameLogicParams) => {
  const [gameState, setGameState] = useState<'playing' | 'finished'>('playing');
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [incorrectAttempts, setIncorrectAttempts] = useState<T[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);

  const timerRef = useRef<number | null>(null);
  const gameEndedRef = useRef(false);

  const cleanupTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleGameFinish = useCallback(() => {
    if (gameEndedRef.current) return;
    setGameState('finished');
    cleanupTimer();
    onGameEnd();
    gameEndedRef.current = true;
    logger.log('Game finished.');
  }, [cleanupTimer, onGameEnd]);

  useEffect(() => {
    // Initial status update
    onStatusUpdate({ timeLeft, currentQuestion: 1, totalQuestions });
  }, []); // Run only once on mount

  const proceedToNext = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      playVictorySound(lang);
      handleGameFinish();
    }
  }, [currentQuestionIndex, totalQuestions, lang, handleGameFinish]);

  useEffect(() => {
    if (gameState === 'playing') {
       onStatusUpdate({ timeLeft, currentQuestion: currentQuestionIndex + 1, totalQuestions });
    }
  }, [timeLeft, currentQuestionIndex, totalQuestions, onStatusUpdate, gameState]);
  
  const setupTimer = useCallback(() => {
    gameEndedRef.current = false;
    timerRef.current = window.setInterval(() => setTimeLeft(prev => prev - 1), 1000);
  }, []);

  useEffect(() => {
    setupTimer();
    return cleanupTimer;
  }, [setupTimer, cleanupTimer]);

  useEffect(() => {
    if (timeLeft <= 0 && gameState === 'playing') {
      handleGameFinish();
    }
  }, [timeLeft, handleGameFinish, gameState]);
  
  const handleCorrect = useCallback(() => {
    onCorrect();
    setScore(prev => prev + 1);
    proceedToNext();
  }, [onCorrect, proceedToNext]);

  const handleIncorrect = useCallback((attemptData: T) => {
    setIncorrectAttempts(prev => [...prev, attemptData]);
    proceedToNext();
  }, [proceedToNext]);

  const resetGame = useCallback(() => {
    logger.log('Resetting game via useGameLogic hook.');
    cleanupTimer();
    setTimeLeft(timeLimit);
    setCurrentQuestionIndex(0);
    setScore(0);
    setIncorrectAttempts([]);
    setIsReviewing(false);
    setGameState('playing');
    setupTimer();
  }, [timeLimit, cleanupTimer, setupTimer]);

  return {
    gameState,
    timeLeft,
    currentQuestionIndex,
    score,
    incorrectAttempts,
    isReviewing,
    handleCorrect,
    handleIncorrect,
    resetGame,
    setIsReviewing
  };
};