// app/game/components/EndGameButton.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveToLeaderboard } from '../actions';

export default function EndGameButton({ gameId }: { gameId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleEndGame = async () => {
    setIsLoading(true);
    const result = await saveToLeaderboard(gameId, true);
    setIsLoading(false);

    if (result.error) {
      alert(result.error);
      return;
    }

    setIsModalOpen(false);
    router.push('/leaderboard');
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className='btn btn-error btn-sm'
      >
        게임 종료
      </button>

      {isModalOpen && (
        <div className='modal modal-open'>
          <div className='modal-box'>
            <h3 className='font-bold text-lg'>게임을 종료하시겠습니까?</h3>
            <p className='py-4'>
              현재 점수로 리더보드에 기록되며, 이 게임은 더 이상 진행할 수
              없습니다.
            </p>
            <div className='modal-action'>
              <button
                className='btn btn-error'
                onClick={handleEndGame}
                disabled={isLoading}
              >
                {isLoading ? '처리중...' : '종료하기'}
              </button>
              <button
                className='btn'
                onClick={() => setIsModalOpen(false)}
                disabled={isLoading}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
