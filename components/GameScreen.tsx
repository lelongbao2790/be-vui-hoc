
import React, { useState, useCallback } from 'react';
import type { Level, Difficulty } from '../types.ts';
import { LevelType } from '../types.ts';
import ClickBasicLevel from './levels/ClickBasicLevel.tsx';
import ClickTargetLevel from './levels/ClickTargetLevel.tsx';
import MathLevel from './levels/MathLevel.tsx';
import VietnameseFillWordLevel from './levels/VietnameseFillWordLevel.tsx';
import VietnameseScrambleLevel from './levels/VietnameseScrambleLevel.tsx';
import VietnameseRhymeMatchLevel from './levels/VietnameseRhymeMatchLevel.tsx';
import EnglishFillWordLevel from './levels/EnglishFillWordLevel.tsx';
import EnglishListenTypeLevel from './levels/EnglishListenTypeLevel.tsx';
import EnglishImageWordMatchLevel from './levels/EnglishImageWordMatchLevel.tsx';
import EnglishListenFillSentenceLevel from './levels/EnglishListenFillSentenceLevel.tsx';
import TypingBasicLevel from './levels/TypingBasicLevel.tsx';
import TypingVietnameseVowelsLevel from './levels/TypingVietnameseVowelsLevel.tsx';
import { HomeIcon } from './icons/HomeIcon.tsx';

interface GameScreenProps {
  level: Level;
  difficulty: Difficulty;
  onGoHome: () => void;
  onCorrectAnswer: (points?: number) => void;
  onGameEnd: () => void;
}

interface GameStatus {
  score?: number;
  timeLeft?: number;
  currentQuestion?: number;
  totalQuestions?: number;
  cpm?: number;
  accuracy?: number;
}


const GameScreen: React.FC<GameScreenProps> = ({ level, difficulty, onGoHome, onCorrectAnswer, onGameEnd }) => {
  const [gameStatus, setGameStatus] = useState<GameStatus | null>(null);

  const handleStatusUpdate = useCallback((status: GameStatus) => {
    setGameStatus(status);
  }, []);

  const renderLevel = () => {
    switch (level.type) {
      case LevelType.CLICK_BASIC:
        return <ClickBasicLevel difficulty={difficulty} onCorrect={() => onCorrectAnswer(1)} onStatusUpdate={handleStatusUpdate} onGameEnd={onGameEnd} />; // 1 point per click
      case LevelType.CLICK_TARGET:
        return <ClickTargetLevel difficulty={difficulty} onCorrect={onCorrectAnswer} onGameEnd={onGameEnd} onStatusUpdate={handleStatusUpdate} />;
      case LevelType.MATH_ADD_SUBTRACT:
        return <MathLevel difficulty={difficulty} onCorrect={onCorrectAnswer} onStatusUpdate={handleStatusUpdate} onGameEnd={onGameEnd} />;
      case LevelType.VIETNAMESE_FILL_WORD:
        return <VietnameseFillWordLevel difficulty={difficulty} onCorrect={onCorrectAnswer} onStatusUpdate={handleStatusUpdate} onGameEnd={onGameEnd} />;
      case LevelType.VIETNAMESE_SCRAMBLE_WORD:
        return <VietnameseScrambleLevel difficulty={difficulty} onCorrect={onCorrectAnswer} onStatusUpdate={handleStatusUpdate} onGameEnd={onGameEnd} />;
      case LevelType.VIETNAMESE_RHYME_MATCH:
        return <VietnameseRhymeMatchLevel difficulty={difficulty} onCorrect={onCorrectAnswer} onStatusUpdate={handleStatusUpdate} onGameEnd={onGameEnd} />;
      case LevelType.ENGLISH_FILL_WORD:
        return <EnglishFillWordLevel difficulty={difficulty} onCorrect={onCorrectAnswer} onStatusUpdate={handleStatusUpdate} onGameEnd={onGameEnd} />;
      case LevelType.ENGLISH_LISTEN_TYPE:
        return <EnglishListenTypeLevel difficulty={difficulty} onCorrect={onCorrectAnswer} onStatusUpdate={handleStatusUpdate} onGameEnd={onGameEnd} />;
      case LevelType.ENGLISH_IMAGE_WORD_MATCH:
        return <EnglishImageWordMatchLevel difficulty={difficulty} onCorrect={onCorrectAnswer} onStatusUpdate={handleStatusUpdate} onGameEnd={onGameEnd} />;
      case LevelType.ENGLISH_LISTEN_FILL_SENTENCE:
        return <EnglishListenFillSentenceLevel difficulty={difficulty} onCorrect={onCorrectAnswer} onStatusUpdate={handleStatusUpdate} onGameEnd={onGameEnd} />;
      case LevelType.TYPING_BASIC:
        return <TypingBasicLevel difficulty={difficulty} onCorrect={onCorrectAnswer} onStatusUpdate={handleStatusUpdate} onGameEnd={onGameEnd} />;
      case LevelType.TYPING_VIETNAMESE_VOWELS:
        return <TypingVietnameseVowelsLevel difficulty={difficulty} onCorrect={onCorrectAnswer} onStatusUpdate={handleStatusUpdate} onGameEnd={onGameEnd} />;
      default:
        return <div>Trò chơi không tồn tại</div>;
    }
  };
  
  const showTime = gameStatus && typeof gameStatus.timeLeft !== 'undefined' && gameStatus.timeLeft > 0;
  const showTypingStatus = gameStatus && (typeof gameStatus.cpm === 'number' || typeof gameStatus.accuracy === 'number');

  return (
    <div>
      <div className="mb-4">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-3xl font-bold text-slate-700">{level.title}</h2>
                <p className="text-slate-500">{level.description}</p>
            </div>
            <button
                onClick={onGoHome}
                className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-3 rounded-full shadow-lg transition-transform transform hover:scale-110 flex-shrink-0"
                aria-label="Về trang chủ"
            >
                <HomeIcon className="w-8 h-8"/>
            </button>
        </div>
        
        <div className="flex justify-center flex-wrap gap-4 text-xl font-bold mt-2">
            {showTime && (
                <div className="bg-sky-200 p-2 rounded-lg shadow min-w-[160px] text-center">Thời gian: <span className="text-red-500">{gameStatus.timeLeft}</span></div>
            )}
            {gameStatus && typeof gameStatus.currentQuestion === 'number' && (
                <div className="bg-lime-200 p-2 rounded-lg shadow min-w-[160px] text-center">Câu: <span className="text-lime-700">{gameStatus.currentQuestion}/{gameStatus.totalQuestions}</span></div>
            )}
            {gameStatus && level.type === LevelType.CLICK_BASIC && typeof gameStatus.score === 'number' && (
                  <div className="bg-amber-200 p-2 rounded-lg shadow min-w-[160px] text-center">Điểm: <span className="text-green-600">{gameStatus.score}</span></div>
            )}
            {showTypingStatus && (
              <>
                {typeof gameStatus.cpm === 'number' && <div className="bg-purple-200 p-2 rounded-lg shadow min-w-[160px] text-center">Tốc độ: <span className="text-purple-700">{gameStatus.cpm} cpm</span></div>}
                {typeof gameStatus.accuracy === 'number' && <div className="bg-pink-200 p-2 rounded-lg shadow min-w-[160px] text-center">Chính xác: <span className="text-pink-700">{gameStatus.accuracy}%</span></div>}
              </>
            )}
        </div>

      </div>

      <div className="bg-white/80 rounded-xl p-4 md:p-8 min-h-[400px] relative">
        {renderLevel()}
      </div>
    </div>
  );
};

export default GameScreen;
