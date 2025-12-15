
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { playCorrectSound } from '../../utils/sounds.ts';
import { CLICK_EMOJIS } from '../../constants.ts';
import { Difficulty } from '../../types.ts';

interface ClickBasicLevelProps {
  difficulty: Difficulty;
  onCorrect: () => void;
  onStatusUpdate: (status: { score: number; timeLeft: number }) => void;
  onGameEnd: () => void;
}

type GameState = 'playing' | 'finished';

const TIME_LIMITS: Record<Difficulty, number> = {
    [Difficulty.EASY]: 60,
    [Difficulty.MEDIUM]: 45,
    [Difficulty.HARD]: 30,
};

const ClickBasicLevel: React.FC<ClickBasicLevelProps> = ({ difficulty, onCorrect, onStatusUpdate, onGameEnd }) => {
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

  useEffect(() => {
    moveTarget();
    gameEndedRef.current = false;
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return cleanupTimer;
  }, [moveTarget, cleanupTimer]);

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

  const resetGame = () => {
    setTimeLeft(TIME_LIMITS[difficulty]);
    setScore(0);
    setGameState('playing');
  }

  if (gameState === 'finished') {
    return (
        <div className="flex flex-col items-center gap-4 text-center">
            <h3 className="text-5xl font-bold text-rose-500">Hết giờ!</h3>
            <p className="text-3xl">Điểm của bạn là: <span className="font-bold text-blue-600">{score}</span></p>
            <button
                onClick={resetGame}
                className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 text-2xl rounded-full shadow-lg transition-transform transform hover:scale-105"
            >
                Chơi lại
            </button>
        </div>
    )
  }

  return (
    <div className="w-full h-full relative">
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
