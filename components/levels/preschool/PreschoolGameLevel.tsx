
import React, { useState, useEffect, useCallback } from 'react';
import type { Level, PreschoolItem, PreschoolColor, PreschoolShape } from '../../../types';
import { LevelType } from '../../../types';
import { useGameLogic } from '../../../hooks/useGameLogic';
import { getPreschoolAnimals, getPreschoolObjects, getPreschoolColors, getPreschoolShapes } from '../../../utils/dataLoader';
import { speakText, playCorrectSound, playEncouragementSound, playVictorySound } from '../../../utils/sounds';
import FeedbackIndicator from '../../FeedbackIndicator';
import GameEndScreen from '../../GameEndScreen';
import ReviewMistakesScreen from '../../ReviewMistakesScreen';
import { StarIcon } from '../../icons/StarIcon';
import { CircleIcon } from '../../icons/CircleIcon';
import { SquareIcon } from '../../icons/SquareIcon';
import { TriangleIcon } from '../../icons/TriangleIcon';
import { HeartIcon } from '../../icons/HeartIcon';
import { logger } from '../../../utils/logger';

// --- Props & Types ---
interface PreschoolGameLevelProps {
  level: Level;
  onCorrect: () => void;
  onGameEnd: () => void;
  onStatusUpdate: (status: { currentQuestion: number; totalQuestions: number; }) => void;
  onGoToMenu: () => void;
}
type FeedbackStatus = 'correct' | 'incorrect' | null;

// Unified type for all game items to avoid 'any' and 'unknown' issues
interface GameItem {
  id: string | number;
  name?: string;
  image?: string;
  hex?: string;
  value?: number;
  item?: string;
}

interface Challenge<T> {
  prompt: string;
  correctAnswer: T;
  options: T[];
}
interface IncorrectAttempt<T> {
    prompt: string;
    correctAnswer: T;
    selectedAnswer: T;
}

const TOTAL_QUESTIONS = 10;
const OPTION_COUNT = 4;
const COUNTING_MAX = 10;
const COUNTING_EMOJIS = ['🍎', '🍊', '🍓', '🍌', '⚽️', '🚗', '🎈', '⭐'];

const shuffleArray = <T,>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

// --- Shape Icon Mapping ---
const shapeComponents: Record<string, React.FC<any>> = {
  star: StarIcon,
  circle: CircleIcon,
  square: SquareIcon,
  triangle: TriangleIcon,
  heart: HeartIcon,
};


const PreschoolGameLevel: React.FC<PreschoolGameLevelProps> = ({ level, onCorrect, onGameEnd, onStatusUpdate, onGoToMenu }) => {
  const [data, setData] = useState<GameItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [challenge, setChallenge] = useState<Challenge<GameItem> | null>(null);
  const [feedback, setFeedback] = useState<FeedbackStatus>(null);
  
  const gameLogic = useGameLogic<IncorrectAttempt<GameItem>>({
    totalQuestions: TOTAL_QUESTIONS,
    timeLimit: 999, // Effectively untimed
    onGameEnd,
    onCorrect,
    onStatusUpdate,
    lang: 'vi',
  });

  const { gameState, score, incorrectAttempts, isReviewing, handleCorrect, handleIncorrect, resetGame, setIsReviewing } = gameLogic;

  // 1. Data Loading Effect
  useEffect(() => {
    let loader: Promise<any[]>;
    switch (level.type) {
      case LevelType.PRESCHOOL_ANIMALS:
        loader = getPreschoolAnimals();
        break;
      case LevelType.PRESCHOOL_OBJECTS:
        loader = getPreschoolObjects();
        break;
      case LevelType.PRESCHOOL_COLORS:
        loader = getPreschoolColors();
        break;
      case LevelType.PRESCHOOL_SHAPES:
        loader = getPreschoolShapes();
        break;
      default: // Counting needs no data
        loader = Promise.resolve([]);
    }
    loader.then(loadedData => {
      // Cast loaded data to GameItem[] as they share compatible structures
      setData(loadedData as GameItem[]);
      setIsLoading(false);
      logger.log(`Data loaded for ${level.type}`, loadedData);
    });
  }, [level.type]);

  // 2. Challenge Generation Logic
  const generateChallenge = useCallback(() => {
    if ((data.length < OPTION_COUNT && level.type !== LevelType.PRESCHOOL_COUNTING) || gameState === 'finished') {
      return;
    }
    logger.log(`Generating new challenge for ${level.type}`);
    let newChallenge: Challenge<GameItem>;

    if (level.type === LevelType.PRESCHOOL_COUNTING) {
        const itemEmoji = COUNTING_EMOJIS[Math.floor(Math.random() * COUNTING_EMOJIS.length)];
        const correctNumber = Math.floor(Math.random() * COUNTING_MAX) + 1;
        const wrongOptions = new Set<number>();
        while(wrongOptions.size < OPTION_COUNT - 1) {
            const wrong = Math.floor(Math.random() * COUNTING_MAX) + 1;
            if (wrong !== correctNumber) wrongOptions.add(wrong);
        }
        newChallenge = {
            prompt: `Có mấy ${itemEmoji} ở đây?`,
            correctAnswer: { id: correctNumber, value: correctNumber, item: itemEmoji },
            options: shuffleArray([
                { id: correctNumber, value: correctNumber, item: itemEmoji },
                ...Array.from(wrongOptions).map(n => ({ id: n, value: n, item: itemEmoji }))
            ])
        };
    } else {
        const shuffledData = shuffleArray(data);
        const selectedItems = shuffledData.slice(0, OPTION_COUNT);
        const correctAnswer = selectedItems[0];
        
        newChallenge = {
            prompt: `Bé hãy tìm ${correctAnswer.name}`,
            correctAnswer: correctAnswer,
            options: shuffleArray(selectedItems)
        };
    }
    
    setChallenge(newChallenge);
    speakText(newChallenge.prompt, 'vi');

  }, [data, level.type, gameState]);

  // 3. Generate challenge on load and when question index changes
  useEffect(() => {
    if (!isLoading) {
      generateChallenge();
    }
  }, [isLoading, gameLogic.currentQuestionIndex, generateChallenge]);

  // 4. Handle User Selection
  const handleSelection = (selectedOption: GameItem) => {
    if (feedback || !challenge) return;
    
    const isCorrect = selectedOption.id === challenge.correctAnswer.id;
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      playCorrectSound();
      setTimeout(() => {
        handleCorrect();
        setFeedback(null);
      }, 1000);
    } else {
      playEncouragementSound('vi');
      handleIncorrect({
        prompt: challenge.prompt,
        correctAnswer: challenge.correctAnswer,
        selectedAnswer: selectedOption
      });
      setTimeout(() => setFeedback(null), 1000);
    }
  };
  
  // 5. Render Logic
  const renderOption = (option: GameItem) => {
    switch (level.type) {
      case LevelType.PRESCHOOL_COLORS:
        return (
          <button
            key={option.id}
            onClick={() => handleSelection(option)}
            style={{ backgroundColor: option.hex }}
            className="w-32 h-32 md:w-48 md:h-48 rounded-2xl shadow-lg transform hover:-translate-y-2 transition-transform duration-300 border-8 border-white/80"
            aria-label={option.name}
          />
        );
      case LevelType.PRESCHOOL_SHAPES:
        const ShapeComponent = shapeComponents[option.id as string];
        return (
            <button
                key={option.id}
                onClick={() => handleSelection(option)}
                className="w-32 h-32 md:w-48 md:h-48 rounded-2xl shadow-lg transform hover:-translate-y-2 transition-transform duration-300 border-8 border-white/80 bg-gradient-to-br from-sky-300 to-blue-400 text-white flex items-center justify-center"
            >
                {ShapeComponent && <ShapeComponent className="w-24 h-24 md:w-32 md:h-32" />}
            </button>
        );
      case LevelType.PRESCHOOL_COUNTING:
        return (
            <button
                key={option.id}
                onClick={() => handleSelection(option)}
                className="w-32 h-32 md:w-48 md:h-48 rounded-full shadow-lg transform hover:-translate-y-2 transition-transform duration-300 border-8 border-white/80 bg-gradient-to-br from-lime-400 to-green-500 text-white flex items-center justify-center text-8xl font-bold"
            >
                {option.value}
            </button>
        );
      case LevelType.PRESCHOOL_ANIMALS:
      case LevelType.PRESCHOOL_OBJECTS:
      default:
        return (
          <button
            key={option.id}
            onClick={() => handleSelection(option)}
            className="w-32 h-32 md:w-48 md:h-48 rounded-2xl shadow-lg transform hover:-translate-y-2 transition-transform duration-300 border-8 border-white/80 bg-white flex items-center justify-center text-8xl md:text-9xl"
          >
            {option.image}
          </button>
        );
    }
  };
  
  const renderChallengeContent = () => {
      if (!challenge) return null;
      if(level.type === LevelType.PRESCHOOL_COUNTING) {
          return (
             <div className="flex flex-wrap justify-center items-center gap-4 p-4 min-h-[150px] max-w-2xl mx-auto">
                {Array.from({ length: challenge.correctAnswer.value || 0 }).map((_, i) => (
                    <span key={i} className="text-6xl md:text-7xl">{challenge.correctAnswer.item}</span>
                ))}
            </div>
          )
      }
      return null;
  }
  
  // 6. Final Render
  if (isLoading) return <div>Đang tải trò chơi...</div>;

  if (gameState === 'finished') {
    if (isReviewing) {
      return (
        <ReviewMistakesScreen
          incorrectAttempts={incorrectAttempts}
          onBack={() => setIsReviewing(false)}
          renderAttempt={(attempt: IncorrectAttempt<GameItem>, index) => (
            <div key={index} className="p-3 bg-red-100 rounded-lg text-left">
              <p className="font-bold text-xl">{attempt.prompt}</p>
              <p className="text-lg text-red-700">Bé đã chọn: {attempt.selectedAnswer.name || attempt.selectedAnswer.value}</p>
              <p className="text-lg text-green-700">Đáp án đúng: {attempt.correctAnswer.name || attempt.correctAnswer.value}</p>
            </div>
          )}
        />
      );
    }
    if (score === TOTAL_QUESTIONS) playVictorySound('vi');
    return (
      <GameEndScreen
        title={score === TOTAL_QUESTIONS ? "Bé giỏi quá!" : "Hoàn thành!"}
        onReset={resetGame}
        onGoToMenu={onGoToMenu}
        onReview={() => setIsReviewing(true)}
        showReviewButton={incorrectAttempts.length > 0}
      >
        <p className="text-3xl">Bé đã trả lời đúng: <span className="font-bold text-blue-600">{score} / {TOTAL_QUESTIONS}</span> câu</p>
      </GameEndScreen>
    );
  }

  if (!challenge) return <div>Đang tạo câu đố...</div>;

  return (
    <div className="w-full flex flex-col items-center justify-center relative">
        <h3 className="text-3xl md:text-4xl font-bold mb-6 p-4 bg-yellow-200 border-4 border-yellow-400 rounded-xl shadow-md text-center">
            {challenge.prompt}
        </h3>
        
        {renderChallengeContent()}

        <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-4">
            {challenge.options.map(option => renderOption(option))}
        </div>
        
        <FeedbackIndicator status={feedback} />
    </div>
  );
};

export default PreschoolGameLevel;
