import React from 'react';

interface ReviewMistakesScreenProps<T> {
  incorrectAttempts: T[];
  onBack: () => void;
  renderAttempt: (attempt: T, index: number) => React.ReactNode;
  title?: string;
}
function ReviewMistakesScreen<T>({
  incorrectAttempts,
  onBack,
  renderAttempt,
  title = "Xem Lại Lỗi Sai",
}: ReviewMistakesScreenProps<T>) {
  return (
    <div className="w-full text-center">
        <h3 className="text-3xl font-bold text-rose-500 mb-4">{title}</h3>
        <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {incorrectAttempts.map(renderAttempt)}
        </div>
        <button
            onClick={onBack}
            className="mt-6 bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-6 text-xl rounded-full shadow-lg"
        >
            Quay lại
        </button>
    </div>
  )
};

export default ReviewMistakesScreen;