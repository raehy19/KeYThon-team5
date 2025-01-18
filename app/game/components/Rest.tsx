// app/game/components/PartTimeJob.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getHour, getNextDayTime } from '@/utils/time';
import { updateGameAfterRest } from '../actions';

interface RestProps {
  gameId: string;
  currentTime: number;
  mental: number;
}

export default function Rest({
  gameId,
  currentTime,
  mental,
}: RestProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [canClose, setCanClose] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startWork = () => {
    const currentHour = getHour(currentTime);

    

    setIsModalOpen(true);
    setIsResting(true);
    setProgress(0);
    setCanClose(false);
    setError(null);

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 2;
        if (next >= 100) {
          clearInterval(interval);
          setIsResting(false);
          setCanClose(true);
          return 100;
        }
        return next;
      });
    }, 100);
  };

  const completeWork = () => {
    const Increasedmental = Math.floor(Math.random() * 10) + 5;
    

    let newTime = currentTime + 6;
    if (getHour(newTime) >= 24) {
      newTime = getNextDayTime(newTime);
    }

    updateGameAfterRest(gameId, newTime, Increasedmental)
      .then(() => {
        setIsModalOpen(false);
        setProgress(0);
        setCanClose(false);
        setIsResting(false);
        router.refresh();
      })
      .catch((error) => {
        console.error('Error updating game:', error);
        setError('알바 완료 처리 중 오류가 발생했습니다.');
      });
  };

  return (
    <div>
      <button
        onClick={startWork}
        className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400'
        disabled={isResting}
      >
        휴식하기
      </button>

      {error && (
        <div className='mt-2 p-2 bg-red-100 text-red-700 rounded'>{error}</div>
      )}

      {isModalOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-lg max-w-sm w-full mx-4'>
            <h3 className='font-bold text-lg mb-4'>휴식 중...</h3>

            <div className='w-full bg-gray-200 rounded-full h-4 mb-4'>
              <div
                className='bg-blue-500 h-4 rounded-full transition-all duration-200'
                style={{ width: `${progress}%` }}
              />
            </div>

            {canClose && (
              <div className='flex justify-end'>
                <button
                  className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                  onClick={completeWork}
                >
                  휴식 완료
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}