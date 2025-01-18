'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getHour, getNextDayTime } from '@/utils/time';
import { updateGameAfterPerformance } from '../actions';

interface PerformanceProps {
  gameId: string;
  currentTime: number;
  mental: number;
  fame: number;
}

export default function Performance({
  gameId,
  currentTime,
  mental,
  fame,
}: PerformanceProps) {
  const router = useRouter();
  const [isSelectingVenue, setIsSelectingVenue] = useState(false);
  const [randomVenue, setRandomVenue] = useState<{ name: string; minFame: number; getfame: number } | null>(null);
  const [isPerforming, setIsPerforming] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const venues = [
    { name: '버스킹', minFame: 0, getfame: 10 },
    { name: '작은 공연장', minFame: 50, getfame: 30 },
    { name: '클럽', minFame: 30, getfame: 20 },
    { name: '대형 콘서트', minFame: 100, getfame: 40 },
  ];

  const startPreparation = () => {
    const currentHour = getHour(currentTime);

    if (currentHour < 13) {
      setError('공연은 오후 1시부터 오후 6시 전까지 가능합니다.');
      return;
    }

    if (mental < 30) {
      setError('멘탈이 너무 낮아서 공연을 준비할 수 없습니다.');
      return;
    }

    const randomIndex = Math.floor(Math.random() * venues.length);
    setRandomVenue(venues[randomIndex]);
    setIsSelectingVenue(true);
    setError(null);
  };

  const startPerformance = () => {
    if (!randomVenue) return;

    if (fame < randomVenue.minFame) {
      setError(`${randomVenue.name}에서 공연하려면 최소 ${randomVenue.minFame} 이상의 명성이 필요합니다.`);
      return;
    }

    setIsPerforming(true);
    setIsSelectingVenue(false);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 2;
        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        return next;
      });
    }, 100);
  };

  const cancelPerformance = () => {
    setIsSelectingVenue(false);
    setRandomVenue(null);
    setError(null);
  };

  const completePerformance = async () => {
    if (!randomVenue) return;

    const fameIncreased = randomVenue.getfame;
    const moneyEarned = Math.floor(Math.random() * 50) + 20;
    const mentalDecreased = Math.floor(Math.random() * 10) + 5;

    let newTime = currentTime + 6;
    if (getHour(newTime) >= 24) {
      newTime = getNextDayTime(newTime);
    }

    try {
      console.log('업데이트 요청:', {
        gameId,
        moneyEarned,
        mentalDecreased,
        newTime,
        fameIncreased,
      });

      await updateGameAfterPerformance(gameId, moneyEarned, mentalDecreased, newTime, fameIncreased);

      console.log('업데이트 성공');
      setRandomVenue(null);
      setProgress(0);
      setIsPerforming(false);
      router.refresh();
    } catch (err) {
      console.error('Error updating game:', err);
      setError('공연 완료 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      {!isSelectingVenue && !isPerforming && (
        <button
          onClick={startPreparation}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          공연하기
        </button>
      )}

      {isSelectingVenue && randomVenue && (
        <div className="mt-4 space-y-4">
          <h3 className="font-bold text-lg mb-4">공연장 선택</h3>
          <div className="p-4 bg-gray-100 rounded-lg shadow">
            <p className="text-lg font-bold mb-2">{randomVenue.name}</p>
            <p>필요 명성: {randomVenue.minFame}</p>
            <div className="flex gap-4 mt-4">
              <button
                onClick={startPerformance}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                disabled={fame < randomVenue.minFame}
              >
                계속하기
              </button>
              <button
                onClick={cancelPerformance}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                포기하기
              </button>
            </div>
          </div>
        </div>
      )}

      {isPerforming && (
        <div className="mt-4">
          <h3 className="font-bold text-lg mb-4">
            {randomVenue?.name}에서 공연 중...
          </h3>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div
              className="bg-blue-500 h-4 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          {progress >= 100 && (
            <button
              onClick={completePerformance}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              공연 완료
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="mt-2 p-2 bg-red-100 text-red-700 rounded">{error}</div>
      )}
    </div>
  );
}
