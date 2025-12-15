import React from 'react';

interface GameEndScreenProps {
  title: string;
  onReset: () => void;
  onReview?: () => void;
  showReviewButton?: boolean;
  children: React.ReactNode;
}

const GameEndScreen: React.FC<GameEndScreenProps> = ({
  title,
  onReset,
  onReview,
  showReviewButton,
  children,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-4 text-center">
      <h3 className="text-5xl font-bold text-rose-500">{title}</h3>
      {children}
      <div className="flex gap-4 mt-4">
        <button
          onClick={onReset}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 text-2xl rounded-full shadow-lg transition-transform transform hover:scale-105"
        >
          Chơi lại
        </button>
        {showReviewButton && onReview && (
          <button
            onClick={onReview}
            className="bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 px-8 text-2xl rounded-full shadow-lg transition-transform transform hover:scale-105"
          >
            Xem Lại Lỗi Sai
          </button>
        )}
      </div>
    </div>
  );
};

export default GameEndScreen;
