import React, { useState, useEffect, useCallback, useRef } from 'react';
import { playCorrectSound } from '../../utils/sounds';
import { CLICK_EMOJIS } from '../../constants';
import { Difficulty } from '../../types';
import GameEndScreen from '../GameEndScreen';

interface ClickBasicLevelProps {
  difficulty: Difficulty;
  onCorrect: () => void;
  onStatusUpdate: (status: { score: number; timeLeft: number }) => void;
  onGameEnd: () => void;
  onGoToMenu: () => void;
}

type GameState = 'playing' | 'finished';

const TIME_LIMITS: Record<Difficulty, number> = {
    [Difficulty.EASY]: 60,
    [Difficulty.MEDIUM]: 45,
    [Difficulty.HARD]: 30,
};

const ClickBasicLevel: React.FC<ClickBasicLevelProps> = ({ difficulty, onCorrect, onStatusUpdate, onGameEnd, onGoToMenu }) => {
  const [position, setPosition] = useState({ top: '50%', left: '50%' });
  const [emoji, setEmoji] = useState('🎯');
  const [key, setKey] = useState(0);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [timeLeft, setTimeLeft] = useState(TIME_LIMITS[difficulty]);
  const [score, setScore] = useState(0);
  
  const timerRef = useRef<number | null>(null);
  const gameEndedRef = useRef(false);

  useEffect(() => {
    onStatusUpdate({ score, timeLeft });
  }, [score, timeLeft, onStatusUpdate]);

  const moveTarget = useCallback(() => {
    const newTop = `${Math.floor(Math.random() * 85) + 5}%`;
    const newLeft = `${Math.floor(Math.random() * 85) + 5}%`;
    setPosition({ top: newTop, left: newLeft });
    setEmoji(CLICK_EMOJIS[Math.floor(Math.random() * CLICK_EMOJIS.length)]);
    setKey(prev => prev + 1);
  }, []);
  
  const cleanupTimer = useCallback(() => {
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }
  }, []);

  const setupGame = useCallback(() => {
    setTimeLeft(TIME_LIMITS[difficulty]);
    setScore(0);
    setGameState('playing');
    moveTarget();
    gameEndedRef.current = false;
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
  }, [difficulty, moveTarget]);

  useEffect(() => {
    setupGame();
    return cleanupTimer;
  }, [setupGame, cleanupTimer]);

  useEffect(() => {
    if (timeLeft <= 0 && !gameEndedRef.current) {
      setGameState('finished');
      cleanupTimer();
      onGameEnd();
      gameEndedRef.current = true;
    }
  }, [timeLeft, cleanupTimer, onGameEnd]);


  const handleClick = () => {
    playCorrectSound();
    onCorrect();
    setScore(prev => prev + 1);
    moveTarget();
  };

  if (gameState === 'finished') {
    return (
        <GameEndScreen title="Hết giờ!" onReset={setupGame} onGoToMenu={onGoToMenu}>
             <p className="text-3xl">Điểm của bạn là: <span className="font-bold text-blue-600">{score}</span></p>
        </GameEndScreen>
    )
  }

  return (
    <div className="w-full min-h-[400px] relative">
        <button
            key={key}
            onClick={handleClick}
            className="absolute text-7xl md:text-8xl transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-in-out hover:scale-110 animate-pulse"
            style={{ top: position.top, left: position.left }}
            aria-label="Click me"
        >
            {emoji}
        </button>
    </div>
  );
};

export default ClickBasicLevel;