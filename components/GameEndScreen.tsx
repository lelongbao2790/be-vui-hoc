import React from 'react';
import { testIdFor } from '../utils/testIds';

interface GameEndScreenProps {
  title: string;
  onReset: () => void;
  onGoToMenu: () => void;
  onReview?: () => void;
  showReviewButton?: boolean;
  children: React.ReactNode;
}

const GameEndScreen: React.FC<GameEndScreenProps> = ({
  title,
  onReset,
  onGoToMenu,
  onReview,
  showReviewButton,
  children,
}) => {
  return (
    <div id={testIdFor('game-end','root')} data-testid={testIdFor('game-end','root')} className="flex flex-col items-center justify-center min-h-[400px] w-full gap-4 text-center">
      <h3 className="text-5xl font-bold text-rose-500">{title}</h3>
      {children}
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        <button
          id={testIdFor('game-end','reset')}
          data-testid={testIdFor('game-end','reset')}
          onClick={onReset}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 text-xl rounded-full shadow-lg transition-transform transform hover:scale-105"
        >
          Chơi lại
        </button>
        {showReviewButton && onReview && (
          <button
            id={testIdFor('game-end','review')}
            data-testid={testIdFor('game-end','review')}
            onClick={onReview}
            className="bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 px-8 text-xl rounded-full shadow-lg transition-transform transform hover:scale-105"
          >
            Xem Lại Lỗi Sai
          </button>
        )}
        <button
          id={testIdFor('game-end','menu')}
          data-testid={testIdFor('game-end','menu')}
          onClick={onGoToMenu}
          className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 text-xl rounded-full shadow-lg transition-transform transform hover:scale-105"
        >
          Về Menu
        </button>
      </div>
    </div>
  );
};

export default GameEndScreen;