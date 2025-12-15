import React, { useState, useEffect, useCallback } from 'react';
import { getEnglishWords } from '../../utils/dataLoader';
import type { EnglishWord, Difficulty } from '../../types';
import { playCorrectSound, playEncouragementSound, speakText } from '../../utils/sounds';
import FeedbackIndicator from '../FeedbackIndicator';
import { useGameLogic } from '../../hooks/useGameLogic';
import GameEndScreen from '../GameEndScreen';
import ReviewMistakesScreen from '../ReviewMistakesScreen';

interface IncorrectAttempt {
    word: EnglishWord;
    selectedOption: string;
}

interface EnglishImageWordMatchLevelProps {
  difficulty: Difficulty;
  onCorrect: () => void;
  onStatusUpdate: (status: { timeLeft: number; currentQuestion: number; totalQuestions: number; }) => void;
  onGameEnd: () => void;
  onGoToMenu: () => void;
}

type FeedbackStatus = 'correct' | 'incorrect' | null;

const TOTAL_QUESTIONS = 5;
const TIME_LIMIT = 90;

const EnglishImageWordMatchLevel: React.FC<EnglishImageWordMatchLevelProps> = ({ difficulty, onCorrect, onStatusUpdate, onGameEnd, onGoToMenu }) => {
  const [allWords, setAllWords] = useState<EnglishWord[]>([]);
  const [questionDeck, setQuestionDeck] = useState<EnglishWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWord, setCurrentWord] = useState<EnglishWord | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<FeedbackStatus>(null);
  
  const gameLogic = useGameLogic<IncorrectAttempt>({
    totalQuestions: TOTAL_QUESTIONS,
    timeLimit: TIME_LIMIT,
    onGameEnd,
    onCorrect,
    onStatusUpdate,
    lang: 'en',
  });

  const { gameState, timeLeft, score, incorrectAttempts, isReviewing, handleCorrect, handleIncorrect, resetGame, setIsReviewing } = gameLogic;
  
  useEffect(() => {
    getEnglishWords().then(data => {
        setAllWords(data);
        const filtered = data.filter(w => w.difficulty === difficulty);
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        setQuestionDeck(shuffled);
        setIsLoading(false);
    });
  }, [difficulty]);

  const getNewChallenge = useCallback(() => {
    let correctWord: EnglishWord;
    const wordList = allWords.filter(w => w.difficulty === difficulty);
    if (wordList.length < 3) return;

    if (questionDeck.length === 0) {
        const shuffled = [...wordList].sort(() => Math.random() - 0.5);
        correctWord = shuffled[0];
        setQuestionDeck(shuffled.slice(1));
    } else {
        correctWord = questionDeck[0];
        setQuestionDeck(prev => prev.slice(1));
    }
    
    setCurrentWord(correctWord);

    const wrongOptions = new Set<string>();
    while (wrongOptions.size < 2) {
        const wrongIndex = Math.floor(Math.random() * wordList.length);
        if (wordList[wrongIndex].word !== correctWord.word) {
            wrongOptions.add(wordList[wrongIndex].word);
        }
    }
    
    const allOptions = [correctWord.word, ...Array.from(wrongOptions)].sort(() => Math.random() - 0.5);
    setOptions(allOptions);

  }, [questionDeck, allWords, difficulty]);
  
  const setupGame = useCallback(() => {
    resetGame();
    if (!isLoading) {
        getNewChallenge();
    }
  }, [resetGame, getNewChallenge, isLoading]);

  useEffect(() => {
    if (!isLoading && allWords.length > 2 && !currentWord) {
        getNewChallenge();
    }
  }, [isLoading, allWords, currentWord, getNewChallenge]);

  useEffect(() => {
      if (gameLogic.currentQuestionIndex > 0 && gameState === 'playing') {
          getNewChallenge();
      }
  }, [gameLogic.currentQuestionIndex, gameState]);
  
  const handleOptionClick = (option: string) => {
    if (feedback || !currentWord) return;

    speakText(option, 'en');

    const isCorrect = option === currentWord.word;
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      playCorrectSound();
      setTimeout(() => {
        handleCorrect();
        setFeedback(null);
      }, 1000);
    } else {
      playEncouragementSound('en');
      handleIncorrect({ word: currentWord, selectedOption: option });
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  if (isLoading) return <div>Loading data...</div>;

  if (gameState === 'finished') {
    if (isReviewing) {
        return (
            <ReviewMistakesScreen
                title="Review Mistakes"
                incorrectAttempts={incorrectAttempts}
                onBack={() => setIsReviewing(false)}
                renderAttempt={(attempt: IncorrectAttempt, index) => (
                    <div key={index} className="p-3 bg-red-100 rounded-lg text-left">
                        <p className="font-bold text-xl">Image: {attempt.word.image}</p>
                        <p className="text-lg text-red-700">You chose: {attempt.selectedOption}</p>
                        <p className="text-lg text-green-700">Correct answer: {attempt.word.word}</p>
                    </div>
                )}
            />
        )
    }

    return (
        <GameEndScreen
            title={timeLeft > 0 ? "Complete!" : "Time's up!"}
            onReset={setupGame}
            onGoToMenu={onGoToMenu}
            onReview={() => setIsReviewing(true)}
            showReviewButton={incorrectAttempts.length > 0}
        >
            <p className="text-3xl">You answered: <span className="font-bold text-blue-600">{score} / {TOTAL_QUESTIONS}</span></p>
        </GameEndScreen>
    )
  }
  
  if (!currentWord) return <div>Loading...</div>;

  return (
    <div className="w-full flex flex-col items-center justify-center relative">
        <h3 className="text-3xl md:text-4xl font-bold mb-4 text-center">
            What is this?
        </h3>
        <div className="text-9xl mb-6 h-40 flex items-center justify-center">{currentWord.image}</div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {options.map((option) => (
                <button
                    key={option}
                    onClick={() => handleOptionClick(option)}
                    className="min-w-[150px] bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-8 text-3xl rounded-lg shadow-lg transition-transform transform hover:scale-105"
                >
                    {option}
                </button>
            ))}
        </div>
        <FeedbackIndicator status={feedback} />
    </div>
  );
};

export default EnglishImageWordMatchLevel;