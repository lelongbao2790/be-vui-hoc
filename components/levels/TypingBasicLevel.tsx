import React, { useState, useEffect, useCallback, useRef } from 'react';
import { playCorrectSound, playIncorrectSound } from '../../utils/sounds';
import { logger } from '../../utils/logger';
import type { Difficulty } from '../../types';
import GameEndScreen from '../GameEndScreen';

interface TypingBasicLevelProps {
  difficulty: Difficulty;
  onCorrect: (points: number) => void;
  onStatusUpdate: (status: { cpm: number; accuracy: number; }) => void;
  onGameEnd: () => void;
}

type GameState = 'playing' | 'finished';

const generateText = () => {
    const chars = 'asdfjkl;';
    let text = '';
    for (let i = 0; i < 10; i++) {
        let word = '';
        const len = Math.floor(Math.random() * 3) + 3; // 3 to 5 chars
        for(let j = 0; j < len; j++) {
            word += chars[Math.floor(Math.random() * chars.length)];
        }
        text += word + ' ';
    }
    return text.trim();
}

const TypingBasicLevel: React.FC<TypingBasicLevelProps> = ({ onCorrect, onStatusUpdate, onGameEnd }) => {
  const [textToType, setTextToType] = useState('');
  const [userInput, setUserInput] = useState('');
  const [gameState, setGameState] = useState<GameState>('playing');
  const [finalStats, setFinalStats] = useState({ cpm: 0, accuracy: 100 });
  
  const startTimeRef = useRef<number | null>(null);
  const totalTypedRef = useRef(0);
  const errorsRef = useRef(0);
  const gameEndedRef = useRef(false);

  const setupGame = useCallback(() => {
    logger.log('Setting up new TypingBasicLevel game.');
    const newText = generateText();
    setTextToType(newText);
    setUserInput('');
    setGameState('playing');
    setFinalStats({ cpm: 0, accuracy: 100 });
    startTimeRef.current = null;
    totalTypedRef.current = 0;
    errorsRef.current = 0;
    gameEndedRef.current = false;
    onStatusUpdate({ cpm: 0, accuracy: 100 });
  }, [onStatusUpdate]);

  useEffect(() => {
    setupGame();
  }, [setupGame]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (gameState !== 'playing' || e.key.length > 1) { // Ignore keys like Shift, Ctrl, etc.
      e.preventDefault();
      return;
    }
    e.preventDefault();

    if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
    }

    totalTypedRef.current += 1;
    const currentChar = textToType[userInput.length];

    if (e.key === currentChar) {
        playCorrectSound();
        setUserInput(prev => prev + e.key);
    } else {
        playIncorrectSound();
        errorsRef.current += 1;
    }
    
    // Calculate stats
    const elapsedTime = (Date.now() - (startTimeRef.current || Date.now())) / 1000 / 60; // in minutes
    const correctChars = userInput.length + (e.key === currentChar ? 1 : 0);
    const cpm = elapsedTime > 0 ? Math.round(correctChars / elapsedTime) : 0;
    const accuracy = totalTypedRef.current > 0 ? Math.round(((totalTypedRef.current - errorsRef.current) / totalTypedRef.current) * 100) : 100;
    onStatusUpdate({ cpm, accuracy });
  };
  
  useEffect(() => {
    if (userInput.length === textToType.length && textToType.length > 0) {
      if (!gameEndedRef.current) {
        setGameState('finished');
        const elapsedTimeSeconds = (Date.now() - (startTimeRef.current ?? Date.now())) / 1000;
        const finalCpm = elapsedTimeSeconds > 0 ? Math.round((userInput.length / elapsedTimeSeconds) * 60) : 0;
        const finalAccuracy = totalTypedRef.current > 0 ? Math.round(((totalTypedRef.current - errorsRef.current) / totalTypedRef.current) * 100) : 100;
        setFinalStats({ cpm: finalCpm, accuracy: finalAccuracy });
        onCorrect(finalCpm + finalAccuracy); // Score based on speed and accuracy
        onGameEnd();
        gameEndedRef.current = true;
      }
    }
  }, [userInput, textToType, onCorrect, onGameEnd]);

  if (gameState === 'finished') {
    return (
        <GameEndScreen title="Hoàn thành!" onReset={setupGame}>
            <div className="text-2xl space-y-2">
                <p>Tốc độ: <span className="font-bold text-blue-600">{finalStats.cpm} cpm</span></p>
                <p>Chính xác: <span className="font-bold text-green-600">{finalStats.accuracy}%</span></p>
            </div>
        </GameEndScreen>
    )
  }

  return (
    <div 
        className="w-full flex flex-col items-center justify-center relative outline-none"
        onKeyDown={handleKeyDown}
        tabIndex={0}
        autoFocus
    >
        <p className="text-2xl mb-4">Gõ theo các ký tự dưới đây:</p>
        <div className="w-full max-w-2xl bg-slate-100 p-4 rounded-lg text-4xl font-mono tracking-widest border-2 border-slate-300">
            {textToType.split('').map((char, index) => {
                let colorClass = 'text-slate-400';
                if (index < userInput.length) {
                    colorClass = userInput[index] === char ? 'text-green-600' : 'text-red-500 bg-red-200';
                }
                const isCurrent = index === userInput.length;

                return (
                    <span key={index} className={`${colorClass} ${isCurrent ? 'underline decoration-blue-500 decoration-4' : ''}`}>
                        {char === ' ' && isCurrent ? <span className="opacity-50">_</span> : char}
                    </span>
                )
            })}
        </div>
        <p className="mt-6 text-xl text-sky-700 font-semibold">Hãy nhấp vào đây và bắt đầu gõ nhé!</p>
    </div>
  );
};

export default TypingBasicLevel;