
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { playCorrectSound, playEncouragementSound, playVictorySound } from '../../utils/sounds';
import FeedbackIndicator from '../FeedbackIndicator';
import { Difficulty } from '../../types';
import { logger } from '../../utils/logger';

interface Problem {
  a: number;
  b: number;
  op: '+' | '-';
  answer: number;
}
interface IncorrectAttempt {
  problem: Problem;
  selectedAnswer: number;
}

interface MathLevelProps {
  difficulty: Difficulty;
  onCorrect: () => void;
  onStatusUpdate: (status: { timeLeft: number; currentQuestion: number; totalQuestions: number; }) => void;
  onGameEnd: () => void;
}

type FeedbackStatus = 'correct' | 'incorrect' | null;
type GameState = 'playing' | 'finished';

const TOTAL_QUESTIONS = 10;
const TIME_LIMITS: Record<Difficulty, number> = {
    [Difficulty.EASY]: 120,
    [Difficulty.MEDIUM]: 105,
    [Difficulty.HARD]: 90,
};

const MathLevel: React.FC<MathLevelProps> = ({ difficulty, onCorrect, onStatusUpdate, onGameEnd }) => {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [options, setOptions] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<FeedbackStatus>(null);
  
  const [gameState, setGameState] = useState<GameState>('playing');
  const [timeLeft, setTimeLeft] = useState(TIME_LIMITS[difficulty]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [incorrectAttempts, setIncorrectAttempts] = useState<IncorrectAttempt[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);

  const timerRef = useRef<number | null>(null);
  const gameEndedRef = useRef(false);
  const isHard = difficulty === Difficulty.HARD;
  
  useEffect(() => {
    onStatusUpdate({ timeLeft, currentQuestion: currentQuestionIndex + 1, totalQuestions: TOTAL_QUESTIONS });
  }, [timeLeft, currentQuestionIndex, onStatusUpdate]);

  const cleanupTimer = useCallback(() => {
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }
  }, []);

  const generateProblem = useCallback(() => {
    let a: number, b: number, answer: number;
    const op: '+' | '-' = Math.random() > 0.5 ? '+' : '-';

    if (op === '+') {
      if (isHard) {
        a = Math.floor(Math.random() * 9) + 2;
        b = Math.floor(Math.random() * 8) + (11 - (a % 10));
        if (a + b > 20) { generateProblem(); return; }
      } else {
        a = Math.floor(Math.random() * 10) + 1;
        b = Math.floor(Math.random() * (10 - (a % 10)));
      }
      answer = a + b;
    } else {
      if (isHard) {
        a = Math.floor(Math.random() * 9) + 11;
        b = Math.floor(Math.random() * (a-10)) + (a % 10) + 1;
      } else {
        a = Math.floor(Math.random() * 10) + 10;
        b = Math.floor(Math.random() * (a % 10)) + 1;
      }
      answer = a - b;
    }

    if (answer > 20 || answer < 0) { generateProblem(); return; }
    
    const newProblem = { a, b, op, answer };
    setProblem(newProblem);
    logger.log('New math problem generated:', newProblem);

    const wrongOptions = new Set<number>();
    while (wrongOptions.size < 3) {
      const wrongAnswer = answer + Math.floor(Math.random() * 5) - 2;
      if (wrongAnswer !== answer && wrongAnswer >= 0 && wrongAnswer <= 20) {
        wrongOptions.add(wrongAnswer);
      }
    }
    const allOptions = [answer, ...Array.from(wrongOptions)].sort(() => Math.random() - 0.5);
    setOptions(allOptions);

  }, [isHard]);
  
  const handleGameFinish = useCallback(() => {
    setGameState('finished');
    cleanupTimer();
    if (!gameEndedRef.current) {
      onGameEnd();
      gameEndedRef.current = true;
    }
  }, [cleanupTimer, onGameEnd]);

  useEffect(() => {
    generateProblem();
    gameEndedRef.current = false;
    timerRef.current = window.setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return cleanupTimer;
  }, [generateProblem, cleanupTimer]);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleGameFinish();
    }
  }, [timeLeft, handleGameFinish]);

  const handleAnswerClick = (selectedAnswer: number) => {
    if (feedback) return;

    if (problem && selectedAnswer === problem.answer) {
      logger.log(`Correct answer for math problem. Q: ${problem.a}${problem.op}${problem.b}, A: ${selectedAnswer}`);
      playCorrectSound();
      setFeedback('correct');
      onCorrect();
      setScore(prev => prev + 1);
      
      setTimeout(() => {
        if (currentQuestionIndex < TOTAL_QUESTIONS - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            generateProblem();
            setFeedback(null);
        } else {
            playVictorySound('vi');
            handleGameFinish();
        }
      }, 1000);
    } else {
      logger.warn(`Incorrect answer for math problem. Q: ${problem?.a}${problem?.op}${problem?.b}, A: ${selectedAnswer}, Correct: ${problem?.answer}`);
      playEncouragementSound('vi');
      setFeedback('incorrect');
      if (problem) {
        setIncorrectAttempts(prev => [...prev, { problem, selectedAnswer }]);
      }
      setTimeout(() => {
        if (currentQuestionIndex < TOTAL_QUESTIONS - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            generateProblem();
            setFeedback(null);
        } else {
            handleGameFinish();
        }
      }, 1000);
    }
  };

  const resetGame = () => {
    logger.log('Resetting Math game.');
    setTimeLeft(TIME_LIMITS[difficulty]);
    setCurrentQuestionIndex(0);
    setScore(0);
    setIncorrectAttempts([]);
    setIsReviewing(false);
    setGameState('playing');
    generateProblem();
    gameEndedRef.current = false;
    timerRef.current = window.setInterval(() => setTimeLeft(prev => prev - 1), 1000);
  };

  if (gameState === 'finished') {
    if (isReviewing) {
        return (
            <div className="w-full text-center">
                <h3 className="text-3xl font-bold text-rose-500 mb-4">Xem Lại Lỗi Sai</h3>
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                    {incorrectAttempts.map((attempt, index) => (
                        <div key={index} className="p-3 bg-red-100 rounded-lg text-left">
                            <p className="font-bold text-xl">Câu hỏi: {attempt.problem.a} {attempt.problem.op} {attempt.problem.b}</p>
                            <p className="text-lg text-red-700">Bé chọn: {attempt.selectedAnswer}</p>
                            <p className="text-lg text-green-700">Đáp án đúng: {attempt.problem.answer}</p>
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

  if (!problem) return <div>Đang tạo câu hỏi...</div>;

  return (
    <div className="w-full flex flex-col items-center justify-center relative">
      <div className="text-6xl md:text-8xl font-bold mb-8 p-6 bg-white border-4 border-blue-300 rounded-2xl shadow-md">
        <span>{problem.a}</span>
        <span className="mx-4 text-blue-500">{problem.op}</span>
        <span>{problem.b}</span>
        <span className="mx-4 text-red-500">=</span>
        <span>?</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => handleAnswerClick(option)}
            className="w-24 h-24 md:w-32 md:h-32 flex items-center justify-center bg-gradient-to-br from-green-400 to-lime-500 hover:from-green-500 hover:to-lime-600 text-white font-bold text-5xl rounded-2xl shadow-lg transform hover:-translate-y-2 transition-transform duration-200 border-4 border-white/50"
          >
            {option}
          </button>
        ))}
      </div>
      <FeedbackIndicator status={feedback} />
    </div>
  );
};

export default MathLevel;
