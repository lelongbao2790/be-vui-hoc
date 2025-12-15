import React, { useState, useEffect, useCallback } from 'react';
import { getVietnameseScrambleSentences } from '../../utils/dataLoader';
import { Difficulty, type ScrambleSentence } from '../../types';
import { playCorrectSound, playEncouragementSound } from '../../utils/sounds';
import FeedbackIndicator from '../FeedbackIndicator';
import { useGameLogic } from '../../hooks/useGameLogic';
import GameEndScreen from '../GameEndScreen';
import ReviewMistakesScreen from '../ReviewMistakesScreen';

interface IncorrectAttempt {
    correctSentence: string;
    playerAnswer: string;
}

interface VietnameseScrambleLevelProps {
  difficulty: Difficulty;
  onCorrect: () => void;
  onStatusUpdate: (status: { timeLeft: number; currentQuestion: number; totalQuestions: number; }) => void;
  onGameEnd: () => void;
  onGoToMenu: () => void;
}

type FeedbackStatus = 'correct' | 'incorrect' | null;

const TOTAL_QUESTIONS = 5;
const TIME_LIMITS: Record<Difficulty, number> = {
    [Difficulty.EASY]: 120,
    [Difficulty.MEDIUM]: 150, // Not used but keep for consistency
    [Difficulty.HARD]: 180,
};

const VietnameseScrambleLevel: React.FC<VietnameseScrambleLevelProps> = ({ difficulty, onCorrect, onStatusUpdate, onGameEnd, onGoToMenu }) => {
  const [allSentences, setAllSentences] = useState<ScrambleSentence[]>([]);
  const [questionDeck, setQuestionDeck] = useState<ScrambleSentence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSentence, setCurrentSentence] = useState<ScrambleSentence | null>(null);
  const [scrambledWords, setScrambledWords] = useState<string[]>([]);
  const [playerAnswer, setPlayerAnswer] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<FeedbackStatus>(null);
  
  const gameLogic = useGameLogic<IncorrectAttempt>({
    totalQuestions: TOTAL_QUESTIONS,
    timeLimit: TIME_LIMITS[difficulty],
    onGameEnd,
    onCorrect,
    onStatusUpdate,
    lang: 'vi',
  });

  const { gameState, timeLeft, score, incorrectAttempts, isReviewing, handleCorrect, handleIncorrect, resetGame, setIsReviewing } = gameLogic;

  useEffect(() => {
    getVietnameseScrambleSentences().then(data => {
        setAllSentences(data);
        // Initial shuffle filtered by difficulty
        const filtered = data.filter(s => s.difficulty === difficulty);
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        setQuestionDeck(shuffled);
        setIsLoading(false);
    });
  }, [difficulty]); // Refetch/reshuffle if difficulty changes

  const shuffleArray = (array: string[]): string[] => {
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // Ensure it's not the same as the original
    if (shuffled.join(' ') === array.join(' ')) {
        return shuffleArray(array);
    }
    return shuffled;
  };

  const getNewSentence = useCallback(() => {
    let nextSentence: ScrambleSentence;

    if (questionDeck.length === 0) {
        // Reshuffle if deck empty
        const filtered = allSentences.filter(s => s.difficulty === difficulty);
        if (filtered.length === 0) return;
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        // Take first, set rest
        nextSentence = shuffled[0];
        setQuestionDeck(shuffled.slice(1));
    } else {
        nextSentence = questionDeck[0];
        setQuestionDeck(prev => prev.slice(1));
    }
    
    setCurrentSentence(nextSentence);
    setPlayerAnswer([]);
    setScrambledWords(shuffleArray(nextSentence.sentence.split(' ')));
  }, [allSentences, difficulty, questionDeck]);
  
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

  // Next question trigger
  useEffect(() => {
      if (gameLogic.currentQuestionIndex > 0 && gameState === 'playing') {
          getNewSentence();
      }
  }, [gameLogic.currentQuestionIndex, gameState]);


  const handleWordClick = (word: string, index: number) => {
    setPlayerAnswer(prev => [...prev, word]);
    setScrambledWords(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleResetCurrent = () => {
    if (currentSentence) {
        setPlayerAnswer([]);
        setScrambledWords(shuffleArray(currentSentence.sentence.split(' ')));
    }
  };

  const handleSubmit = () => {
    if (feedback || !currentSentence) return;
    
    const isCorrect = playerAnswer.join(' ') === currentSentence.sentence;

    setFeedback(isCorrect ? 'correct' : 'incorrect');
    if (isCorrect) {
        playCorrectSound();
        setTimeout(() => {
            handleCorrect();
            setFeedback(null);
        }, 1000);
    } else {
        playEncouragementSound('vi');
        handleIncorrect({ correctSentence: currentSentence.sentence, playerAnswer: playerAnswer.join(' ') });
        setTimeout(() => setFeedback(null), 1000);
    }
  }
  
  if (isLoading) return <div>Đang tải dữ liệu...</div>;
  
  if (gameState === 'finished') {
    if (isReviewing) {
        return (
             <ReviewMistakesScreen
                incorrectAttempts={incorrectAttempts}
                onBack={() => setIsReviewing(false)}
                renderAttempt={(attempt: IncorrectAttempt, index) => (
                    <div key={index} className="p-3 bg-red-100 rounded-lg text-left">
                        <p className="font-bold text-xl">Câu đúng: <span className="text-green-700">{attempt.correctSentence}</span></p>
                        <p className="text-lg">Bé xếp: <span className="text-red-700">{attempt.playerAnswer || "(bỏ trống)"}</span></p>
                    </div>
                )}
            />
        )
    }

    return (
       <GameEndScreen
          title={timeLeft > 0 ? "Hoàn thành!" : "Hết giờ!"}
          onReset={setupGame}
          onGoToMenu={onGoToMenu}
          onReview={() => setIsReviewing(true)}
          showReviewButton={incorrectAttempts.length > 0}
        >
            <p className="text-3xl">Bé đã trả lời đúng: <span className="font-bold text-blue-600">{score} / {TOTAL_QUESTIONS}</span> câu</p>
        </GameEndScreen>
    )
  }

  if (!currentSentence) return <div>Đang tải câu...</div>;

  return (
    <div className="w-full flex flex-col items-center justify-center relative text-center">
        <h3 className="text-2xl md:text-3xl font-bold mb-4">Hãy sắp xếp các từ sau thành câu đúng:</h3>
        
        <div className="min-h-[80px] w-full max-w-2xl bg-white p-4 rounded-xl border-4 border-dashed border-sky-300 mb-6 flex flex-wrap justify-center gap-4 items-center">
            {playerAnswer.map((word, index) => (
                <span key={index} className="text-3xl font-bold text-slate-800">{word}</span>
            ))}
        </div>

        <div className="w-full max-w-2xl flex flex-wrap justify-center gap-4 mb-8">
            {scrambledWords.map((word, index) => (
                <button
                    key={index}
                    onClick={() => handleWordClick(word, index)}
                    className="bg-amber-400 hover:bg-amber-500 text-white font-bold py-3 px-6 text-2xl rounded-lg shadow-md transition-transform transform hover:scale-105"
                >
                    {word}
                </button>
            ))}
        </div>

        <div className="flex gap-4">
            <button
                onClick={handleResetCurrent}
                className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-8 text-2xl rounded-full shadow-lg"
            >
                Làm lại
            </button>
            <button
                onClick={handleSubmit}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 text-2xl rounded-full shadow-lg"
                disabled={playerAnswer.length !== currentSentence.sentence.split(' ').length}
            >
                Kiểm tra
            </button>
        </div>
        <FeedbackIndicator status={feedback} />
    </div>
  );
};

export default VietnameseScrambleLevel;