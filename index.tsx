import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';

// ==========================================
// 1. CONSTANTS (Converted from Enums)
// ==========================================

const Subject = {
  CLICKING: 'CLICKING',
  MATH: 'MATH',
  VIETNAMESE: 'VIETNAMESE',
  ENGLISH: 'ENGLISH',
  TYPING: 'TYPING',
};

const PreschoolSubject = {
  COLORS: 'PRESCHOOL_COLORS',
  ANIMALS: 'PRESCHOOL_ANIMALS',
  OBJECTS: 'PRESCHOOL_OBJECTS',
  SHAPES: 'PRESCHOOL_SHAPES',
  COUNTING: 'PRESCHOOL_COUNTING',
};

const LevelType = {
  CLICK_BASIC: 'CLICK_BASIC',
  CLICK_TARGET: 'CLICK_TARGET',
  MATH_ADD_SUBTRACT: 'MATH_ADD_SUBTRACT',
  VIETNAMESE_FILL_WORD: 'VIETNAMESE_FILL_WORD',
  VIETNAMESE_SCRAMBLE_WORD: 'VIETNAMESE_SCRAMBLE_WORD',
  VIETNAMESE_RHYME_MATCH: 'VIETNAMESE_RHYME_MATCH',
  ENGLISH_FILL_WORD: 'ENGLISH_FILL_WORD',
  ENGLISH_LISTEN_TYPE: 'ENGLISH_LISTEN_TYPE',
  ENGLISH_IMAGE_WORD_MATCH: 'ENGLISH_IMAGE_WORD_MATCH',
  ENGLISH_LISTEN_FILL_SENTENCE: 'ENGLISH_LISTEN_FILL_SENTENCE',
  TYPING_BASIC: 'TYPING_BASIC',
  TYPING_VIETNAMESE_VOWELS: 'TYPING_VIETNAMESE_VOWELS',
  PRESCHOOL_COLORS: 'PRESCHOOL_COLORS',
  PRESCHOOL_ANIMALS: 'PRESCHOOL_ANIMALS',
  PRESCHOOL_OBJECTS: 'PRESCHOOL_OBJECTS',
  PRESCHOOL_SHAPES: 'PRESCHOOL_SHAPES',
  PRESCHOOL_COUNTING: 'PRESCHOOL_COUNTING',
};

const Difficulty = {
    EASY: 'EASY',
    MEDIUM: 'MEDIUM',
    HARD: 'HARD',
};

// ==========================================
// 2. UTILS (Logger, Storage, Sounds)
// ==========================================

const logger = {
  log: (...args: any[]) => console.log('[Bé Vui Học]', ...args),
  info: (...args: any[]) => console.info('[Bé Vui Học] [INFO]', ...args),
  warn: (...args: any[]) => console.warn('[Bé Vui Học] [WARN]', ...args),
  error: (...args: any[]) => console.error('[Bé Vui Học] [ERROR]', ...args),
};

const HIGH_SCORES_KEY = 'beVuiHocHighScores';
const loadHighScores = () => {
  try {
    const scoresJSON = localStorage.getItem(HIGH_SCORES_KEY);
    return scoresJSON ? JSON.parse(scoresJSON) : {};
  } catch (error) {
    return {};
  }
};
const saveHighScores = (scores: any) => {
  try {
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(scores));
  } catch (error) {}
};

// Sounds
let audioContext: any = null;
const getAudioContext = () => {
  if (typeof window !== 'undefined' && !audioContext) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
        audioContext = new AudioContextClass();
    }
  }
  return audioContext;
};

const playSound = (type: any, frequency: any, duration: any) => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
};

const playCorrectSound = () => {
  playSound('sine', 600, 0.2);
  setTimeout(() => playSound('sine', 800, 0.2), 100);
};

const playIncorrectSound = () => {
  playSound('square', 200, 0.3);
};

const speakText = (text: string, lang = 'en') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'vi' ? 'vi-VN' : 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
};

const playVictorySound = (lang: any) => {
    playCorrectSound();
    // Simplified victory logic
};
const playEncouragementSound = (lang: any) => {
    playIncorrectSound();
};

// ==========================================
// 3. DATA
// ==========================================

const CLICK_EMOJIS = ['⚽️', '🍎', '⭐', '🚗', '🎈', '🐶', '🐱', '🌞', '💎', '🍓'];
const TARGET_EMOJIS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐯', '🦁'];

const VIETNAMESE_WORDS = [
    { "image": "☔️", "sentence": "Cơn m__", "missing": "ưa", "to_type": "ua", "answer": "mưa" },
    { "image": "🐟", "sentence": "Con c__", "missing": "á", "to_type": "a", "answer": "cá" },
    { "image": "🐔", "sentence": "Con g__", "missing": "à", "to_type": "a", "answer": "gà" },
    { "image": "🏠", "sentence": "Ngôi nh__", "missing": "à", "to_type": "a", "answer": "nhà" },
    { "image": "📖", "sentence": "Quyển s__ch", "missing": "á", "to_type": "a", "answer": "sách" }
];

const ENGLISH_WORDS = [
    { "image": "🍎", "word": "apple", "sentence": "an a__le", "missing": "pp", "difficulty": Difficulty.EASY },
    { "image": "⚽️", "word": "ball", "sentence": "a b__l", "missing": "al", "difficulty": Difficulty.EASY },
    { "image": "🐱", "word": "cat", "sentence": "a c__t", "missing": "a", "difficulty": Difficulty.EASY },
    { "image": "🐶", "word": "dog", "sentence": "a d__g", "missing": "o", "difficulty": Difficulty.EASY },
    { "image": "🚗", "word": "car", "sentence": "a c__r", "missing": "a", "difficulty": Difficulty.EASY }
];

const PRESCHOOL_ANIMALS = [
  { "id": "dog", "name": "Con Chó", "image": "🐶" },
  { "id": "cat", "name": "Con Mèo", "image": "🐱" },
  { "id": "chicken", "name": "Con Gà", "image": "🐔" },
  { "id": "pig", "name": "Con Heo", "image": "🐷" },
  { "id": "duck", "name": "Con Vịt", "image": "🦆" }
];

const PRESCHOOL_COLORS = [
  { "id": "red", "name": "Màu Đỏ", "hex": "#ef4444" },
  { "id": "blue", "name": "Màu Xanh Dương", "hex": "#3b82f6" },
  { "id": "green", "name": "Màu Xanh Lá", "hex": "#22c55e" },
  { "id": "yellow", "name": "Màu Vàng", "hex": "#eab308" }
];

const LEVELS = [
  { type: LevelType.CLICK_BASIC, subject: Subject.CLICKING, title: 'Click Thần Tốc', description: 'Click thật nhanh!', difficulties: [Difficulty.EASY, Difficulty.HARD] },
  { type: LevelType.MATH_ADD_SUBTRACT, subject: Subject.MATH, title: 'Toán Cộng Trừ', description: 'Phép tính vui nhộn.', difficulties: [Difficulty.EASY] },
  { type: LevelType.ENGLISH_FILL_WORD, subject: Subject.ENGLISH, title: 'Fill Blank', description: 'Điền chữ tiếng Anh.', difficulties: [Difficulty.EASY] },
  { type: LevelType.TYPING_BASIC, subject: Subject.TYPING, title: 'Gõ Phím', description: 'Luyện gõ nhanh.', difficulties: [Difficulty.EASY] },
  { type: LevelType.VIETNAMESE_FILL_WORD, subject: Subject.VIETNAMESE, title: 'Điền Từ TV', description: 'Điền từ tiếng Việt.', difficulties: [Difficulty.EASY] },
];

const PRESCHOOL_LEVELS = [
  { type: LevelType.PRESCHOOL_COLORS, subject: PreschoolSubject.COLORS, title: 'Màu Sắc', description: 'Học màu sắc.', difficulties: [Difficulty.EASY] },
  { type: LevelType.PRESCHOOL_ANIMALS, subject: PreschoolSubject.ANIMALS, title: 'Con Vật', description: 'Học con vật.', difficulties: [Difficulty.EASY] },
  { type: LevelType.PRESCHOOL_COUNTING, subject: PreschoolSubject.COUNTING, title: 'Đếm Số', description: 'Học đếm số.', difficulties: [Difficulty.EASY] },
];

// ==========================================
// 4. ICONS (Simplified)
// ==========================================
const SvgWrapper = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} />;
const StarIcon = (p: any) => <SvgWrapper {...p} fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></SvgWrapper>;
const BackIcon = (p: any) => <SvgWrapper {...p} strokeWidth="3"><polyline points="15 18 9 12 15 6"/></SvgWrapper>;
const HomeIcon = (p: any) => <SvgWrapper {...p}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></SvgWrapper>;
const ClickIcon = (p: any) => <SvgWrapper {...p}><path d="M9 11.3-3.2 21.2a2.4 2.4 0 0 0 3.4 3.4L19.3 15"/><path d="m14.3 16.3 5-5a2.4 2.4 0 0 0 0-3.4l-2.6-2.6a2.4 2.4 0 0 0-3.4 0l-5 5"/><path d="m2.1 2.1 6.4 6.4"/><path d="m19 5-5 5"/></SvgWrapper>;
const MathIcon = (p: any) => <SvgWrapper {...p}><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h8"/><path d="M12 8v8"/></SvgWrapper>;
const BookIcon = (p: any) => <SvgWrapper {...p}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></SvgWrapper>;
const EnglishIcon = (p: any) => <SvgWrapper {...p}><path d="M12.16 4.8a2.48 2.48 0 0 0-4.32 0L4.72 12h14.56Z"/><path d="M14.5 12 9.25 20"/><path d="m9.5 12 5.25 8"/><path d="M17.1 12.5h-10.2"/></SvgWrapper>;
const TypingIcon = (p: any) => <SvgWrapper {...p}><rect width="20" height="16" x="2" y="4" rx="2" ry="2"/><path d="M6 8h.01"/><path d="M10 8h.01"/><path d="M14 8h.01"/><path d="M18 8h.01"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/><path d="M7 16h10"/></SvgWrapper>;
const TrophyIcon = (p: any) => <SvgWrapper {...p}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.87 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.13 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></SvgWrapper>;
const TeddyBearIcon = (p: any) => <SvgWrapper {...p}><path d="M15.33 13.67a3 3 0 1 0-4.66 0"/><path d="M12 16.5a2.5 2.5 0 0 0-5 0"/><path d="M17 16.5a2.5 2.5 0 0 1 5 0"/><path d="M12 13a2.5 2.5 0 0 0-5 0"/><path d="M17 13a2.5 2.5 0 0 1 5 0"/><path d="M9 13a2.5 2.5 0 0 0 5 0"/><path d="M12 17.5c-5.52 0-10-4.48-10-10A10 10 0 0 1 12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10Z"/></SvgWrapper>;
const AppleIcon = (p: any) => <SvgWrapper {...p}><path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/></SvgWrapper>;
const PaletteIcon = (p: any) => <SvgWrapper {...p}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></SvgWrapper>;
const PawIcon = (p: any) => <SvgWrapper {...p}><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-7 0V15a5 5 0 0 1 5-5z"/></SvgWrapper>;
const NumbersIcon = (p: any) => <SvgWrapper {...p}><path d="M4 13a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2z"/><path d="M14 6a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2V6z"/><path d="M14 15a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-2z"/><path d="M8 6h-1a2 2 0 0 0-2 2v2"/></SvgWrapper>;

// ==========================================
// 5. HOOKS & SHARED COMPONENTS
// ==========================================

const useGameLogic = (params: any) => {
  const { timeLimit, totalQuestions, onGameEnd, onCorrect, onStatusUpdate, lang } = params;
  const [gameState, setGameState] = useState('playing');
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    onStatusUpdate({ timeLeft, currentQuestion: 1, totalQuestions });
    timerRef.current = window.setInterval(() => setTimeLeft((p: number) => p - 1), 1000);
    return () => { if(timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (gameState === 'playing') onStatusUpdate({ timeLeft, currentQuestion: currentQuestionIndex + 1, totalQuestions });
    if (timeLeft <= 0 && gameState === 'playing') {
        setGameState('finished');
        if(timerRef.current) clearInterval(timerRef.current);
        onGameEnd();
    }
  }, [timeLeft, currentQuestionIndex, gameState]);

  const handleCorrect = () => {
    onCorrect();
    setScore(s => s + 1);
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(p => p + 1);
    } else {
      setGameState('finished');
      if(timerRef.current) clearInterval(timerRef.current);
      playVictorySound(lang);
      onGameEnd();
    }
  };

  const handleIncorrect = () => {
     if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(p => p + 1);
    } else {
      setGameState('finished');
      if(timerRef.current) clearInterval(timerRef.current);
      onGameEnd();
    }
  };

  return { gameState, timeLeft, score, handleCorrect, handleIncorrect };
};

const FeedbackIndicator = ({ status }: { status: any }) => {
  if (!status) return null;
  const isCorrect = status === 'correct';
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
      <div className={`text-6xl p-8 rounded-3xl bg-white shadow-2xl border-8 ${isCorrect ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600'} animate-bounce`}>
        {isCorrect ? '✅ Đúng Rồi!' : '❌ Sai Rồi!'}
      </div>
    </div>
  );
};

const GameEndScreen = ({ title, onReset, onGoToMenu, children }: any) => (
  <div className="flex flex-col items-center justify-center gap-6 min-h-[400px]">
    <h3 className="text-5xl font-bold text-rose-500">{title}</h3>
    {children}
    <div className="flex gap-4">
      <button onClick={onReset} className="bg-green-500 text-white font-bold py-3 px-8 text-xl rounded-full shadow-lg hover:scale-105 transition">Chơi Lại</button>
      <button onClick={onGoToMenu} className="bg-sky-500 text-white font-bold py-3 px-8 text-xl rounded-full shadow-lg hover:scale-105 transition">Về Menu</button>
    </div>
  </div>
);

// ==========================================
// 6. GAME LEVELS
// ==========================================

const ClickBasicLevel = ({ onCorrect, onStatusUpdate, onGameEnd, onGoToMenu }: any) => {
  const [position, setPosition] = useState({ top: '50%', left: '50%' });
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    onStatusUpdate({ score, timeLeft });
    if(timeLeft <= 0 && !ended) {
        setEnded(true);
        onGameEnd();
    }
  }, [timeLeft, score, ended]);

  const handleClick = () => {
    playCorrectSound();
    onCorrect();
    setScore(s => s + 1);
    setPosition({
        top: `${Math.floor(Math.random() * 80) + 10}%`,
        left: `${Math.floor(Math.random() * 80) + 10}%`
    });
  };

  if(ended) return <GameEndScreen title="Hết Giờ!" onReset={() => window.location.reload()} onGoToMenu={onGoToMenu}><p className="text-3xl">Điểm: {score}</p></GameEndScreen>;

  return (
    <div className="w-full h-[400px] relative bg-slate-100 rounded-xl overflow-hidden border-4 border-slate-300">
        <button onClick={handleClick} style={{top: position.top, left: position.left}} className="absolute text-7xl transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition active:scale-90">
            {CLICK_EMOJIS[Math.floor(Math.random() * CLICK_EMOJIS.length)]}
        </button>
    </div>
  );
};

const MathLevel = ({ onCorrect, onGameEnd, onGoToMenu, onStatusUpdate }: any) => {
    const [problem, setProblem] = useState<any>(null);
    const { gameState, handleCorrect, handleIncorrect, timeLeft } = useGameLogic({ timeLimit: 60, totalQuestions: 10, onGameEnd, onCorrect, onStatusUpdate, lang: 'vi' });

    useEffect(() => {
        const a = Math.floor(Math.random() * 10);
        const b = Math.floor(Math.random() * 10);
        setProblem({ a, b, ans: a + b });
    }, [gameState]); // Simpleregen

    if(gameState === 'finished') return <GameEndScreen title="Hoàn Thành!" onReset={() => window.location.reload()} onGoToMenu={onGoToMenu}><p className="text-2xl">Bé giỏi quá!</p></GameEndScreen>;
    if(!problem) return null;

    return (
        <div className="text-center">
            <div className="text-8xl font-bold mb-8 bg-white p-8 rounded-2xl inline-block shadow-lg border-4 border-blue-200">
                {problem.a} + {problem.b} = ?
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                {[problem.ans, problem.ans + 1, problem.ans - 1, problem.ans + 2].sort(() => Math.random() - 0.5).map((opt, i) => (
                    <button key={i} onClick={() => opt === problem.ans ? handleCorrect() : handleIncorrect()} className="bg-blue-500 hover:bg-blue-600 text-white text-4xl font-bold py-6 rounded-xl shadow-md transition">
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
};

const EnglishFillLevel = ({ onCorrect, onGameEnd, onGoToMenu, onStatusUpdate }: any) => {
    const [word, setWord] = useState<any>(null);
    const { gameState, handleCorrect, handleIncorrect } = useGameLogic({ timeLimit: 120, totalQuestions: 5, onGameEnd, onCorrect, onStatusUpdate, lang: 'en' });
    const [input, setInput] = useState('');

    useEffect(() => {
        setWord(ENGLISH_WORDS[Math.floor(Math.random() * ENGLISH_WORDS.length)]);
        setInput('');
    }, [gameState]); // Regen on state change trigger

    const check = () => {
        if(input.toLowerCase() === word.missing) {
            playCorrectSound();
            handleCorrect();
        } else {
            playIncorrectSound();
            handleIncorrect();
        }
    }

    if(gameState === 'finished') return <GameEndScreen title="Good Job!" onReset={() => window.location.reload()} onGoToMenu={onGoToMenu}><p>You did it!</p></GameEndScreen>;
    if(!word) return null;

    return (
        <div className="text-center flex flex-col items-center">
            <div className="text-9xl mb-4">{word.image}</div>
            <div className="text-4xl font-bold mb-6 flex items-center gap-2">
                {word.sentence.split('__')[0]}
                <input value={input} onChange={e => setInput(e.target.value)} className="w-24 text-center border-4 border-orange-400 rounded-lg p-2 bg-orange-50 text-orange-600" />
                {word.sentence.split('__')[1]}
            </div>
            <button onClick={check} className="bg-green-500 text-white text-2xl font-bold py-3 px-10 rounded-full">Check</button>
        </div>
    )
}

const TypingLevel = ({ onCorrect, onGameEnd, onGoToMenu, onStatusUpdate }: any) => {
    const [char, setChar] = useState('');
    const { gameState, handleCorrect } = useGameLogic({ timeLimit: 60, totalQuestions: 20, onGameEnd, onCorrect, onStatusUpdate, lang: 'vi' });

    useEffect(() => {
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        setChar(chars[Math.floor(Math.random() * chars.length)]);
    }, [gameState]); // Regen

    useEffect(() => {
        const handler = (e: any) => {
            if(e.key.toLowerCase() === char) {
                playCorrectSound();
                handleCorrect();
            }
        }
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [char]);

    if(gameState === 'finished') return <GameEndScreen title="Hoàn Thành!" onReset={() => window.location.reload()} onGoToMenu={onGoToMenu}><p>Bé gõ phím rất nhanh!</p></GameEndScreen>;

    return (
        <div className="text-center py-20">
            <p className="text-3xl mb-8">Bé hãy gõ phím:</p>
            <div className="text-9xl font-bold text-sky-600 bg-sky-100 w-40 h-40 rounded-full flex items-center justify-center mx-auto border-8 border-sky-300">
                {char.toUpperCase()}
            </div>
        </div>
    )
}

const PreschoolLevel = ({ level, onCorrect, onGameEnd, onGoToMenu, onStatusUpdate }: any) => {
    const [item, setItem] = useState<any>(null);
    const [options, setOptions] = useState<any[]>([]);
    const { gameState, handleCorrect, handleIncorrect } = useGameLogic({ timeLimit: 999, totalQuestions: 5, onGameEnd, onCorrect, onStatusUpdate, lang: 'vi' });

    useEffect(() => {
        let source: any[] = PRESCHOOL_ANIMALS;
        if(level.type === LevelType.PRESCHOOL_COLORS) source = PRESCHOOL_COLORS;
        
        const target = source[Math.floor(Math.random() * source.length)];
        setItem(target);
        speakText(`Bé hãy tìm ${target.name}`, 'vi');
        
        const opts = [target];
        while(opts.length < 3) {
            const r = source[Math.floor(Math.random() * source.length)];
            if(!opts.find(o => o.id === r.id)) opts.push(r);
        }
        setOptions(opts.sort(() => Math.random() - 0.5));
    }, [gameState, level.type]);

    const check = (opt: any) => {
        if(opt.id === item.id) {
            playCorrectSound();
            handleCorrect();
        } else {
            playIncorrectSound();
            handleIncorrect();
        }
    }

    if(gameState === 'finished') return <GameEndScreen title="Bé Giỏi Quá!" onReset={() => window.location.reload()} onGoToMenu={onGoToMenu}><p>Hoan hô bé!</p></GameEndScreen>;
    if(!item) return null;

    return (
        <div className="text-center">
            <h3 className="text-4xl font-bold mb-10 text-sky-700">Bé hãy tìm: <span className="text-rose-500">{item.name}</span></h3>
            <div className="flex justify-center gap-8">
                {options.map((opt, i) => (
                    <button key={i} onClick={() => check(opt)} className="bg-white p-6 rounded-2xl shadow-xl border-4 border-white hover:border-yellow-400 transition transform hover:scale-110">
                        <div className="text-8xl" style={{color: opt.hex}}>{opt.image || '⬤'}</div>
                    </button>
                ))}
            </div>
        </div>
    )
}

// ==========================================
// 7. SELECTORS & APP
// ==========================================

const LevelSelector = ({ subject, onSelectLevel }: any) => {
    const levels = LEVELS.filter(l => l.subject === subject);
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {levels.map(l => (
                <button key={l.type} onClick={() => onSelectLevel(l)} className="bg-white p-6 rounded-xl shadow-lg border-b-8 border-blue-200 active:border-b-0 active:translate-y-2 transition-all">
                    <h3 className="text-2xl font-bold text-slate-700 mb-2">{l.title}</h3>
                    <p className="text-slate-500">{l.description}</p>
                </button>
            ))}
        </div>
    )
}

const SubjectSelector = ({ onSelectSubject }: any) => {
    const subs = [
        { id: Subject.CLICKING, name: 'Luyện Chuột', icon: <ClickIcon />, color: 'bg-green-100 text-green-600' },
        { id: Subject.MATH, name: 'Toán Học', icon: <MathIcon />, color: 'bg-blue-100 text-blue-600' },
        { id: Subject.ENGLISH, name: 'Tiếng Anh', icon: <EnglishIcon />, color: 'bg-amber-100 text-amber-600' },
        { id: Subject.TYPING, name: 'Gõ Phím', icon: <TypingIcon />, color: 'bg-purple-100 text-purple-600' },
        { id: Subject.VIETNAMESE, name: 'Tiếng Việt', icon: <BookIcon />, color: 'bg-rose-100 text-rose-600' },
    ];
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {subs.map(s => (
                <button key={s.id} onClick={() => onSelectSubject(s.id)} className={`p-8 rounded-2xl shadow-lg flex flex-col items-center gap-4 transition hover:scale-105 ${s.color}`}>
                    <div className="scale-150">{s.icon}</div>
                    <span className="text-2xl font-bold">{s.name}</span>
                </button>
            ))}
        </div>
    )
}

const PreschoolSelector = ({ onSelectLevel }: any) => (
    <div className="grid grid-cols-2 gap-6">
        {PRESCHOOL_LEVELS.map(l => (
            <button key={l.type} onClick={() => onSelectLevel(l)} className="bg-yellow-100 p-8 rounded-3xl shadow-lg border-4 border-yellow-300 hover:bg-yellow-200">
                <div className="text-6xl mb-4">{l.type === LevelType.PRESCHOOL_ANIMALS ? '🐶' : l.type === LevelType.PRESCHOOL_COLORS ? '🎨' : '🔢'}</div>
                <h3 className="text-3xl font-bold text-yellow-800">{l.title}</h3>
            </button>
        ))}
    </div>
);

const AgeSelector = ({ onSelect }: any) => (
    <div className="flex flex-col md:flex-row gap-8 justify-center items-center h-full pt-10">
        <button onClick={() => onSelect('preschool')} className="w-64 h-64 bg-orange-100 rounded-full flex flex-col items-center justify-center border-8 border-orange-300 hover:scale-110 transition shadow-2xl">
            <div className="text-8xl mb-2"><TeddyBearIcon className="w-24 h-24 text-orange-500" /></div>
            <span className="text-3xl font-bold text-orange-700">Mầm Non</span>
        </button>
        <button onClick={() => onSelect('grade1')} className="w-64 h-64 bg-lime-100 rounded-full flex flex-col items-center justify-center border-8 border-lime-300 hover:scale-110 transition shadow-2xl">
            <div className="text-8xl mb-2"><AppleIcon className="w-24 h-24 text-lime-600" /></div>
            <span className="text-3xl font-bold text-lime-800">Lớp 1</span>
        </button>
    </div>
);

// ==========================================
// 8. MAIN APP
// ==========================================

const App = () => {
  const [age, setAge] = useState<any>(null);
  const [subject, setSubject] = useState<any>(null);
  const [level, setLevel] = useState<any>(null);
  const [gameStatus, setGameStatus] = useState<any>({});

  const goHome = () => { setLevel(null); setSubject(null); setAge(null); };
  const goBack = () => {
      if(level) setLevel(null);
      else if(subject) setSubject(null);
      else setAge(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-200 to-blue-300 p-4 md:p-8 font-sans">
        <div className="max-w-5xl mx-auto bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl min-h-[600px] flex flex-col border-8 border-white">
            
            {/* Header */}
            <div className="p-6 border-b-4 border-dashed border-sky-200 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    {age && <button onClick={goBack} className="p-3 bg-white rounded-full shadow hover:bg-slate-50"><BackIcon className="w-6 h-6 text-slate-600"/></button>}
                    <h1 className="text-3xl md:text-4xl font-bold text-sky-600 drop-shadow-sm cursor-pointer" onClick={goHome}>Bé Vui Học</h1>
                </div>
                {level && <div className="bg-yellow-300 px-6 py-2 rounded-full font-bold text-yellow-900 shadow-inner flex items-center gap-2">
                    ⏱️ {gameStatus.timeLeft}s
                </div>}
            </div>

            {/* Content */}
            <div className="p-8 flex-1 flex flex-col justify-center">
                {!age ? (
                    <AgeSelector onSelect={setAge} />
                ) : !subject && !level && age === 'grade1' ? (
                    <SubjectSelector onSelectSubject={setSubject} />
                ) : !level ? (
                    age === 'preschool' 
                    ? <PreschoolSelector onSelectLevel={setLevel} />
                    : <LevelSelector subject={subject} onSelectLevel={setLevel} />
                ) : (
                    <div className="w-full h-full">
                        {/* Level Renderer */}
                        {level.type === LevelType.CLICK_BASIC && <ClickBasicLevel onCorrect={() => {}} onGameEnd={() => {}} onGoToMenu={goHome} onStatusUpdate={setGameStatus} />}
                        {level.type === LevelType.MATH_ADD_SUBTRACT && <MathLevel onCorrect={() => {}} onGameEnd={() => {}} onGoToMenu={goHome} onStatusUpdate={setGameStatus} />}
                        {level.type === LevelType.ENGLISH_FILL_WORD && <EnglishFillLevel onCorrect={() => {}} onGameEnd={() => {}} onGoToMenu={goHome} onStatusUpdate={setGameStatus} />}
                        {level.type === LevelType.TYPING_BASIC && <TypingLevel onCorrect={() => {}} onGameEnd={() => {}} onGoToMenu={goHome} onStatusUpdate={setGameStatus} />}
                        {(level.type.startsWith('PRESCHOOL')) && <PreschoolLevel level={level} onCorrect={() => {}} onGameEnd={() => {}} onGoToMenu={goHome} onStatusUpdate={setGameStatus} />}
                        
                        {/* Fallback for un-implemented levels */}
                        {!['CLICK_BASIC', 'MATH_ADD_SUBTRACT', 'ENGLISH_FILL_WORD', 'TYPING_BASIC'].includes(level.type) && !level.type.startsWith('PRESCHOOL') && (
                            <div className="text-center text-gray-500 text-xl py-20">Trò chơi đang phát triển...</div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 text-center text-sky-700/60 text-sm font-medium">
                Phiên bản v1.6.4-pure-js • Tạo bởi AI cho Bé ❤️
            </div>
        </div>
    </div>
  );
};

// Render
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);