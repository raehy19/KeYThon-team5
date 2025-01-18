'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getHour, getNextDayTime } from '@/utils/time';
import { updateGameAfterPractice } from '../actions';

interface PracticeProps {
  gameId: string;
  currentTime: number;
}

interface Note {
  id: number;
  key: string;
  time: number;
}

export default function Practice({ gameId, currentTime }: PracticeProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPracticing, setIsPracticing] = useState(false);
  const [score, setScore] = useState(0);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNotes, setActiveNotes] = useState<string[]>([]);
  const [canClose, setCanClose] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startPractice = () => {
    setIsModalOpen(true);
    setIsPracticing(true);
    setScore(0);
    setCanClose(false);
    setError(null);
    generateNotes();
  };

  const generateNotes = () => {
    const keys = ['A', 'S', 'D', 'F'];
    const newNotes: Note[] = [];
    let id = 0;

    // 20초 동안의 노트 생성
    for (let i = 0; i < 40; i++) {
      const key = keys[Math.floor(Math.random() * keys.length)];
      newNotes.push({
        id: id++,
        key,
        time: 1000 + i * 500, // 0.5초 간격으로 노트 생성
      });
    }

    setNotes(newNotes);
  };

  // 키 입력 처리
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPracticing) return;

      const key = e.key.toUpperCase();
      if (['A', 'S', 'D', 'F'].includes(key)) {
        const activeNote = activeNotes.find((note) => note === key);
        if (activeNote) {
          setScore((prev) => Math.min(prev + 2.5, 100));
          setActiveNotes((prev) => prev.filter((note) => note !== key));
        } else {
          setScore((prev) => Math.max(prev - 1, 0));
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPracticing, activeNotes]);

  // 노트 애니메이션 및 게임 진행
  useEffect(() => {
    if (!isPracticing) return;

    let startTime = Date.now();
    const gameLoop = setInterval(() => {
      const currentTime = Date.now() - startTime;

      // 현재 시간에 맞는 노트 활성화
      const currentNotes = notes.filter(
        (note) => note.time <= currentTime && note.time > currentTime - 500
      );
      setActiveNotes(currentNotes.map((note) => note.key));

      // 게임 종료 조건
      if (currentTime >= 20000) {
        // 20초 후 종료
        clearInterval(gameLoop);
        setIsPracticing(false);
        setCanClose(true);
      }
    }, 16);

    return () => clearInterval(gameLoop);
  }, [isPracticing, notes]);

  const completePractice = () => {
    let newTime = currentTime + 4;
    if (getHour(newTime) >= 24) {
      newTime = getNextDayTime(newTime);
    }

    updateGameAfterPractice(gameId, score, newTime)
      .then(() => {
        setIsModalOpen(false);
        setScore(0);
        setCanClose(false);
        setIsPracticing(false);
        router.refresh();
      })
      .catch((error) => {
        console.error('Error updating game:', error);
        setError('연습 완료 처리 중 오류가 발생했습니다.');
      });
  };

  return (
    <div>
      <button
        onClick={startPractice}
        className='px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400'
        disabled={isPracticing}
      >
        연습하기
      </button>

      {error && (
        <div className='mt-2 p-2 bg-red-100 text-red-700 rounded'>{error}</div>
      )}

      {isModalOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-lg max-w-md w-full mx-4'>
            <h3 className='font-bold text-lg mb-4'>
              연습 중... (A, S, D, F 키를 사용하세요!)
            </h3>

            <div className='relative h-32 w-full bg-gray-100 mb-4 overflow-hidden'>
              {/* 노트 트랙 */}
              <div className='absolute bottom-0 w-full h-1 bg-gray-300' />

              {/* 활성화된 노트들 */}
              <div className='flex justify-around absolute bottom-0 w-full'>
                {['A', 'S', 'D', 'F'].map((key) => (
                  <div
                    key={key}
                    className={`w-16 h-16 flex items-center justify-center rounded-full 
                      ${activeNotes.includes(key) ? 'bg-purple-500' : 'bg-gray-300'}`}
                  >
                    {key}
                  </div>
                ))}
              </div>
            </div>

            <div className='mb-4'>
              <p className='text-center text-xl'>점수: {Math.round(score)}</p>
            </div>

            {canClose && (
              <div className='flex justify-end'>
                <button
                  className='px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600'
                  onClick={completePractice}
                >
                  연습 완료
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
