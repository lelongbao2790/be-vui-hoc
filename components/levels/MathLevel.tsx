import React, { useState, useEffect, useCallback } from 'react';
import { playCorrectSound, playEncouragementSound } from '../../utils/sounds';
import FeedbackIndicator from '../FeedbackIndicator';
import { Difficulty } from '../../types';
import { logger } from '../../utils/logger';
import { useGameLogic } from '../../hooks/useGameLogic';
import GameEndScreen from '../GameEndScreen';
import ReviewMistakesScreen from '../ReviewMistakesScreen';

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

const TOTAL_QUESTIONS = 10;
const TIME_LIMITS: Record<Difficulty, number> = {
    [Difficulty.EASY]: 120,
    [Difficulty.MEDIUM]: 105, // Not used but keep for consistency
    [Difficulty.HARD]: 90,
};

const MathLevel: React.FC<MathLevelProps> = ({ difficulty, onCorrect, onStatusUpdate, onGameEnd }) => {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [options, setOptions] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<FeedbackStatus>(null);
  
  const isHard = difficulty === Difficulty.HARD;
  
  const gameLogic = useGameLogic<IncorrectAttempt>({
    totalQuestions: TOTAL_QUESTIONS,
    timeLimit: TIME_LIMITS[difficulty],
    onGameEnd,
    onCorrect,
    onStatusUpdate,
    lang: 'vi',
  });

  const { gameState, timeLeft, score, incorrectAttempts, isReviewing, handleCorrect, handleIncorrect, resetGame, setIsReviewing } = gameLogic;

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

  useEffect(() => {
    generateProblem();
  }, [generateProblem, gameLogic.currentQuestionIndex]);


  const handleAnswerClick = (selectedAnswer: number) => {
    if (feedback || !problem) return;

    if (selectedAnswer === problem.answer) {
      logger.log(`Correct answer for math problem. Q: ${problem.a}${problem.op}${problem.b}, A: ${selectedAnswer}`);
      playCorrectSound();
      setFeedback('correct');
      setTimeout(() => {
        handleCorrect();
        setFeedback(null);
      }, 1000);
    } else {
      logger.warn(`Incorrect answer for math problem. Q: ${problem?.a}${problem?.op}${problem?.b}, A: ${selectedAnswer}, Correct: ${problem?.answer}`);
      playEncouragementSound('vi');
      setFeedback('incorrect');
      handleIncorrect({ problem, selectedAnswer });
      setTimeout(() => {
        setFeedback(null);
      }, 1000);
    }
  };

  if (gameState === 'finished') {
    if (isReviewing) {
        return (
             <ReviewMistakesScreen
                incorrectAttempts={incorrectAttempts}
                onBack={() => setIsReviewing(false)}
                renderAttempt={(attempt: IncorrectAttempt, index) => (
                    <div key={index} className="p-3 bg-red-100 rounded-lg text-left">
                        <p className="font-bold text-xl">Câu hỏi: {attempt.problem.a} {attempt.problem.op} {attempt.problem.b}</p>
                        <p className="text-lg text-red-700">Bé chọn: {attempt.selectedAnswer}</p>
                        <p className="text-lg text-green-700">Đáp án đúng: {attempt.problem.answer}</p>
                    </div>
                )}
            />
        )
    }

    return (
      <GameEndScreen
        title={timeLeft > 0 ? "Hoàn thành!" : "Hết giờ!"}
        onReset={resetGame}
        onReview={() => setIsReviewing(true)}
        showReviewButton={incorrectAttempts.length > 0}
      >
        <p className="text-3xl">Bé đã trả lời đúng: <span className="font-bold text-blue-600">{score} / {TOTAL_QUESTIONS}</span> câu</p>
      </GameEndScreen>
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