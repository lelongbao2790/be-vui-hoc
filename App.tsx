import React, { useState, useCallback, useEffect } from 'react';
import LevelSelector from './components/LevelSelector';
import GameScreen from './components/GameScreen';
import DifficultySelector from './components/DifficultySelector';
import SubjectSelector from './components/SubjectSelector';
import AgeSelector from './components/AgeSelector';
import PreschoolSelector from './components/PreschoolSelector';
import type { Level, Difficulty, Subject } from './types';
import { StarIcon } from './components/icons/StarIcon';
import { BackIcon } from './components/icons/BackIcon';
import { loadHighScores, saveHighScores } from './utils/storage';
import { logger } from './utils/logger';
import { APP, testIdFor } from './utils/testIds';

type GameState = 'selecting_subject' | 'selecting_level' | 'selecting_difficulty' | 'playing';
type AgeGroup = 'preschool' | 'grade1';
const APP_VERSION = '1.6.1-fix-navigation';

const App: React.FC = () => {
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroup | null>(null);
  const [gameState, setGameState] = useState<GameState>('selecting_subject');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [score, setScore] = useState(0);
  const [highScores, setHighScores] = useState<Record<string, number>>({});

  useEffect(() => {
    setHighScores(loadHighScores());
    logger.info(`App Initialized. Version: ${APP_VERSION}`);
  }, []);

  const updateHighScore = useCallback((subject: Subject, finalScore: number) => {
    setHighScores(prevHighScores => {
      const currentHighScore = prevHighScores[subject] || 0;
      if (finalScore > currentHighScore) {
        logger.log(`New high score for ${subject}: ${finalScore} (previous: ${currentHighScore})`);
        const newHighScores = { ...prevHighScores, [subject]: finalScore };
        saveHighScores(newHighScores);
        return newHighScores;
      }
      return prevHighScores;
    });
  }, []);

  const handleSelectAgeGroup = useCallback((ageGroup: AgeGroup) => {
    logger.log(`Age group selected: ${ageGroup}`);
    setSelectedAgeGroup(ageGroup);
    if (ageGroup === 'grade1') {
      setGameState('selecting_subject');
    } else {
      // For preschool, the category selector IS the level selector
      setGameState('selecting_level'); 
    }
  }, []);

  const handleSelectSubject = useCallback((subject: Subject) => {
    logger.log(`Subject selected: ${subject}`);
    setSelectedSubject(subject);
    setGameState('selecting_level');
  }, []);

  const handleSelectLevel = useCallback((level: Level) => {
    logger.log(`Level selected: ${level.type}`);
    if (level.difficulties.length === 1) {
        setSelectedLevel(level);
        setSelectedDifficulty(level.difficulties[0]);
        setGameState('playing');
        setScore(0);
    } else {
        setSelectedLevel(level);
        setGameState('selecting_difficulty');
    }
  }, []);

  const handleSelectDifficulty = useCallback((difficulty: Difficulty) => {
    logger.log(`Difficulty selected: ${difficulty}`);
    setSelectedDifficulty(difficulty);
    setGameState('playing');
    setScore(0);
  }, []);

  const handleGoHome = useCallback(() => {
    logger.log(`Navigating back to menu for age group: ${selectedAgeGroup}`);
    if (selectedAgeGroup === 'preschool') {
      setGameState('selecting_level');
    } else { // grade1 or fallback
      setGameState('selecting_subject');
    }
    // Reset level/difficulty selection
    setSelectedLevel(null);
    setSelectedDifficulty(null);
  }, [selectedAgeGroup]);

  const handleBack = useCallback(() => {
    logger.log(`Back button clicked. Current state: ${gameState}, Age: ${selectedAgeGroup}`);
    if (gameState === 'playing' || gameState === 'selecting_difficulty') {
      if (selectedAgeGroup === 'preschool') {
        setGameState('selecting_level');
      } else {
         setGameState(selectedLevel?.difficulties.length === 1 ? 'selecting_subject' : 'selecting_level');
      }
      setSelectedLevel(null);
      setSelectedDifficulty(null);
    } else if (gameState === 'selecting_level') {
       if (selectedAgeGroup === 'preschool') {
         setSelectedAgeGroup(null);
       } else {
         setGameState('selecting_subject');
         setSelectedSubject(null);
       }
    } else if (gameState === 'selecting_subject') {
        setSelectedAgeGroup(null);
    }
  }, [gameState, selectedAgeGroup, selectedLevel]);

  const handleCorrectAnswer = useCallback((points: number = 10) => {
    setScore(prev => prev + points);
  }, []);
  
  const handleGameEnd = useCallback(() => {
    logger.log(`Game ended for subject ${selectedSubject || selectedLevel?.subject} with score ${score}`);
    const subjectKey = selectedSubject || selectedLevel?.subject;
    if (subjectKey) {
      updateHighScore(subjectKey as Subject, score);
    }
  }, [selectedSubject, selectedLevel, score, updateHighScore]);

  const renderContent = () => {
    if (!selectedAgeGroup) {
        return <AgeSelector onSelectAgeGroup={handleSelectAgeGroup} />;
    }

    if (selectedAgeGroup === 'preschool') {
      switch (gameState) {
        case 'playing':
          return <GameScreen level={selectedLevel!} difficulty={selectedDifficulty!} onGoHome={handleGoHome} onCorrectAnswer={handleCorrectAnswer} onGameEnd={handleGameEnd} />;
        case 'selecting_level':
        default:
          return <PreschoolSelector onSelectLevel={handleSelectLevel} />;
      }
    }

    // Grade 1 Flow
    switch (gameState) {
      case 'selecting_level':
        return <LevelSelector subject={selectedSubject!} onSelectLevel={handleSelectLevel} />;
      case 'selecting_difficulty':
        return <DifficultySelector level={selectedLevel!} onSelectDifficulty={handleSelectDifficulty} />;
      case 'playing':
        return <GameScreen level={selectedLevel!} difficulty={selectedDifficulty!} onGoHome={handleGoHome} onCorrectAnswer={handleCorrectAnswer} onGameEnd={handleGameEnd} />;
      case 'selecting_subject':
      default:
        return <SubjectSelector onSelectSubject={handleSelectSubject} highScores={highScores} />;
    }
  };

  const showBackButton = selectedAgeGroup && (gameState !== 'playing');

  return (
    <div id={APP.ROOT} data-testid={testIdFor('app','root')} className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-cyan-200 to-blue-300 text-slate-800">
      <div id={APP.MAIN} data-testid={testIdFor('app','main')} className="w-full max-w-4xl mx-auto bg-white/70 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 border-4 border-white">
        <header className="flex justify-between items-center mb-6 pb-4 border-b-4 border-dashed border-sky-300">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <button id={APP.HEADER_BACK} data-testid={testIdFor('app','header-back')} onClick={handleBack} className="bg-white/50 hover:bg-white/80 text-sky-600 p-3 rounded-full shadow-md transition-colors">
                <BackIcon className="w-6 h-6" />
              </button>
            )}
            <h1 id={APP.TITLE} data-testid={testIdFor('app','title')} className="text-3xl md:text-5xl font-bold text-sky-600 drop-shadow-md">
              Bé Vui Học
            </h1>
          </div>
          {gameState === 'playing' && (
            <div id={APP.SCORE} data-testid={testIdFor('app','score')} className="flex items-center gap-2 bg-amber-300 text-amber-800 font-bold px-4 py-2 rounded-full shadow-lg border-2 border-amber-400">
              <StarIcon className="w-8 h-8"/>
              <span className="text-2xl">{score}</span>
            </div>
          )}
        </header>

        <main>
          {renderContent()}
        </main>
      </div>
       <footer id={APP.FOOTER} data-testid={testIdFor('app','footer')} className="mt-6 text-center text-sky-700">
        <p>Tạo bởi AI với tình yêu dành cho các bé ❤️</p>
        <p className="text-sm opacity-75">Phiên bản {APP_VERSION}</p>
      </footer>
    </div>
  );
};

export default App;