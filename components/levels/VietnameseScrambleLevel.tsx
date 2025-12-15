
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getVietnameseScrambleSentences } from '../../utils/dataLoader.ts';
import { Difficulty, type ScrambleSentence } from '../../types.ts';
import { playCorrectSound, playEncouragementSound, playVictorySound } from '../../utils/sounds.ts';
import FeedbackIndicator from '../FeedbackIndicator.tsx';

interface IncorrectAttempt {
    correctSentence: string;
    playerAnswer: string;
}

interface VietnameseScrambleLevelProps {
  difficulty: Difficulty;
  onCorrect: () => void;
  onStatusUpdate: (status: { timeLeft: number; currentQuestion: number; totalQuestions: number; }) => void;
  onGameEnd: () => void;
}

type FeedbackStatus = 'correct' | 'incorrect' | null;
type GameState = 'playing' | 'finished';

const TOTAL_QUESTIONS = 5;
const TIME_LIMITS: Record<Difficulty, number> = {
    [Difficulty.EASY]: 120,
    [Difficulty.MEDIUM]: 150,
    [Difficulty.HARD]: 180,
};

const VietnameseScrambleLevel: React.FC<VietnameseScrambleLevelProps> = ({ difficulty, onCorrect, onStatusUpdate, onGameEnd }) => {
  const [allSentences, setAllSentences] = useState<ScrambleSentence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSentence, setCurrentSentence] = useState<ScrambleSentence | null>(null);
  const [scrambledWords, setScrambledWords] = useState<string[]>([]);
  const [playerAnswer, setPlayerAnswer] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<FeedbackStatus>(null);
  
  const [gameState, setGameState] = useState<GameState>('playing');
  const [timeLeft, setTimeLeft] = useState(TIME_LIMITS[difficulty]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [usedIndices, setUsedIndices] = useState<number[]>([]);
  const [incorrectAttempts, setIncorrectAttempts] = useState<IncorrectAttempt[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);
  
  const timerRef = useRef<number | null>(null);
  const gameEndedRef = useRef(false);
  
  useEffect(() => {
    getVietnameseScrambleSentences().then(data => {
        setAllSentences(data);
        setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    onStatusUpdate({ timeLeft, currentQuestion: currentQuestionIndex + 1, totalQuestions: TOTAL_QUESTIONS });
  }, [timeLeft, currentQuestionIndex, onStatusUpdate]);

  const cleanupTimer = useCallback(() => {
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }
  }, []);

  const shuffleArray = (array: string[]): string[] => {
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    if (shuffled.join(' ') === array.join(' ')) {
        return shuffleArray(array);
    }
    return shuffled;
  };

  const getNewSentence = useCallback(() => {
    const sentenceList = allSentences.filter(s => s.difficulty === difficulty);
    if (sentenceList.length === 0) return;

    let availableIndices = sentenceList.map((_, i) => i).filter(i => !usedIndices.includes(i));
    if (availableIndices.length === 0 && sentenceList.length > 0) {
        const newRandomIndex = Math.floor(Math.random() * sentenceList.length);
        const newSentence = sentenceList[newRandomIndex];
        setCurrentSentence(newSentence);
        setPlayerAnswer([]);
        setScrambledWords(shuffleArray(newSentence.sentence.split(' ')));
        setUsedIndices([newRandomIndex]);
    } else if (availableIndices.length > 0) {
        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        const newSentence = sentenceList[randomIndex];
        setCurrentSentence(newSentence);
        setPlayerAnswer([]);
        setScrambledWords(shuffleArray(newSentence.sentence.split(' ')));
        setUsedIndices(prev => [...prev, randomIndex]);
    }
  }, [allSentences, difficulty, usedIndices]);

  const handleGameFinish = useCallback(() => {
    setGameState('finished');
    cleanupTimer();
    if (!gameEndedRef.current) {
      onGameEnd();
      gameEndedRef.current = true;
    }
  }, [cleanupTimer, onGameEnd]);

  const setupGame = useCallback(() => {
    const sentenceList = allSentences.filter(s => s.difficulty === difficulty);
    if (sentenceList.length === 0) return;

    const firstRandomIndex = Math.floor(Math.random() * sentenceList.length);
    const firstSentence = sentenceList[firstRandomIndex];
    
    setCurrentSentence(firstSentence);
    setPlayerAnswer([]);
    setScrambledWords(shuffleArray(firstSentence.sentence.split(' ')));
    setUsedIndices([firstRandomIndex]);
    
    if (timerRef.current) cleanupTimer();
    gameEndedRef.current = false;
    timerRef.current = window.setInterval(() => setTimeLeft(prev => prev - 1), 1000);
  }, [allSentences, difficulty, cleanupTimer]);
  
  useEffect(() => {
    if (!isLoading) {
      setupGame();
    }
    return cleanupTimer;
  }, [isLoading, setupGame]);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleGameFinish();
    }
  }, [timeLeft, handleGameFinish]);

  const handleWordClick = (word: string, index: number) => {
    setPlayerAnswer(prev => [...prev, word]);
    setScrambledWords(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleReset = () => {
    if (currentSentence) {
        setPlayerAnswer([]);
        setScrambledWords(shuffleArray(currentSentence.sentence.split(' ')));
    }
  };

  const proceedToNext = () => {
    if (currentQuestionIndex < TOTAL_QUESTIONS - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        getNewSentence();
        setFeedback(null);
    } else {
        playVictorySound('vi');
        handleGameFinish();
    }
  };

  const handleSubmit = () => {
    if (feedback || !currentSentence) return;

    if (playerAnswer.join(' ') === currentSentence.sentence) {
        playCorrectSound();
        setFeedback('correct');
        onCorrect();
        setScore(prev => prev + 1);
        setTimeout(proceedToNext, 1000);
    } else {
        playEncouragementSound('vi');
        setFeedback('incorrect');
        setIncorrectAttempts(prev => [...prev, { correctSentence: currentSentence.sentence, playerAnswer: playerAnswer.join(' ') }]);
        setTimeout(proceedToNext, 1000);
    }
  }

  const resetGame = () => {
    setTimeLeft(TIME_LIMITS[difficulty]);
    setCurrentQuestionIndex(0);
    setScore(0);
    setGameState('playing');
    setIncorrectAttempts([]);
    setIsReviewing(false);
    setupGame();
  };
  
  if (isLoading) return <div>Đang tải dữ liệu...</div>;
  
  if (gameState === 'finished') {
    if (isReviewing) {
        return (
             <div className="w-full text-center">
                <h3 className="text-3xl font-bold text-rose-500 mb-4">Xem Lại Lỗi Sai</h3>
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                    {incorrectAttempts.map((attempt, index) => (
                        <div key={index} className="p-3 bg-red-100 rounded-lg text-left">
                            <p className="font-bold text-xl">Câu đúng: <span className="text-green-700">{attempt.correctSentence}</span></p>
                            <p className="text-lg">Bé xếp: <span className="text-red-700">{attempt.playerAnswer || "(bỏ trống)"}</span></p>
                        </div>
                    ))}
                </div>
                <button
                    onClick={() => setIsReviewing(false)}
                    className="mt-6 bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-6 text-xl rounded-full shadow-lg"
                >
                    Quay lại
                </button>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center gap-4 text-center">
            <h3 className="text-5xl font-bold text-rose-500">{timeLeft > 0 ? "Hoàn thành!" : "Hết giờ!"}</h3>
            <p className="text-3xl">Bé đã trả lời đúng: <span className="font-bold text-blue-600">{score} / {TOTAL_QUESTIONS}</span> câu</p>
            <div className="flex gap-4 mt-4">
                <button
                    onClick={resetGame}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 text-2xl rounded-full shadow-lg transition-transform transform hover:scale-105"
                >
                    Chơi lại
                </button>
                {incorrectAttempts.length > 0 && (
                     <button
                        onClick={() => setIsReviewing(true)}
                        className="bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 px-8 text-2xl rounded-full shadow-lg transition-transform transform hover:scale-105"
                    >
                        Xem Lại Lỗi Sai
                    </button>
                )}
            </div>
        </div>
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
                onClick={handleReset}
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
