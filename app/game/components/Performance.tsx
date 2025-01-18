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
  teamPower: number; // 추가: 팀 전체 능력치
}

interface Venue {
  name: string;
  minFame: number;
  baseFame: number;
  baseMoneyMin: number;
  baseMoneyMax: number;
  description: string;
}

const venues: Venue[] = [
  {
    name: '길거리 버스킹',
    minFame: 0,
    baseFame: 10,
    baseMoneyMin: 5,
    baseMoneyMax: 15,
    description: '지나가는 행인들을 대상으로 하는 거리 공연입니다.',
  },
  {
    name: '동네 카페',
    minFame: 20,
    baseFame: 15,
    baseMoneyMin: 15,
    baseMoneyMax: 30,
    description: '아늑한 분위기의 카페에서 진행하는 소규모 공연입니다.',
  },
  {
    name: '대학교 축제',
    minFame: 30,
    baseFame: 20,
    baseMoneyMin: 30,
    baseMoneyMax: 50,
    description: '젊은 관객들이 모이는 대학 축제 무대입니다.',
  },
  {
    name: '지역 라이브 클럽',
    minFame: 40,
    baseFame: 25,
    baseMoneyMin: 40,
    baseMoneyMax: 70,
    description: '열정적인 관객들이 모이는 라이브 클럽입니다.',
  },
  {
    name: '시내 공연장',
    minFame: 60,
    baseFame: 30,
    baseMoneyMin: 60,
    baseMoneyMax: 100,
    description: '도시 중심가의 중형 공연장입니다.',
  },
  {
    name: '지역 방송 음악 프로그램',
    minFame: 80,
    baseFame: 40,
    baseMoneyMin: 80,
    baseMoneyMax: 150,
    description: '지역 TV 방송에 출연하는 기회입니다.',
  },
  {
    name: '대형 페스티벌',
    minFame: 100,
    baseFame: 50,
    baseMoneyMin: 100,
    baseMoneyMax: 200,
    description: '수많은 관객들이 모이는 대형 야외 페스티벌입니다.',
  },
  {
    name: '전국 음악 방송',
    minFame: 150,
    baseFame: 70,
    baseMoneyMin: 150,
    baseMoneyMax: 300,
    description: '전국 단위 TV 음악 프로그램 출연입니다.',
  },
  {
    name: '전국 아레나 투어',
    minFame: 200,
    baseFame: 100,
    baseMoneyMin: 200,
    baseMoneyMax: 500,
    description: '전국의 대형 공연장을 돌며 진행하는 투어 공연입니다.',
  },
];

export default function Performance({
  gameId,
  currentTime,
  mental,
  fame,
  teamPower,
}: PerformanceProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [randomVenue, setRandomVenue] = useState<Venue | null>(null);
  const [isPerforming, setIsPerforming] = useState(false);
  const [progress, setProgress] = useState(0);
  const [canClose, setCanClose] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [performanceResult, setPerformanceResult] = useState<{
    money: number;
    fame: number;
    message: string;
  } | null>(null);

  const calculatePerformanceResult = (
    venue: Venue,
    teamPower: number,
    mental: number,
    currentFame: number
  ) => {
    // 기본 성과 계산을 위한 팀 능력치 영향도 (0.5 ~ 1.5)
    const powerMultiplier = 0.5 + teamPower / 200; // 팀 능력치가 200일 때 최대

    // 멘탈 상태에 따른 영향도 (0.3 ~ 1.2)
    const mentalMultiplier = 0.3 + (mental / 100) * 0.9;

    // 현재 인지도에 따른 추가 보너스 (1.0 ~ 1.3)
    const fameBonus = 1 + (currentFame / 1000) * 0.3;

    // 최종 배율 계산
    const finalMultiplier = powerMultiplier * mentalMultiplier * fameBonus;

    // 돈과 명성 계산
    const moneyEarned = Math.floor(
      (Math.random() * (venue.baseMoneyMax - venue.baseMoneyMin) +
        venue.baseMoneyMin) *
        finalMultiplier
    );
    const fameGained = Math.floor(venue.baseFame * finalMultiplier);

    // 공연 결과 메시지 생성
    let message = '';
    if (finalMultiplier >= 1.5) {
      message = '대성공! 관객들의 기립 박수가 쏟아졌습니다!';
    } else if (finalMultiplier >= 1.2) {
      message = '성공적인 공연이었습니다!';
    } else if (finalMultiplier >= 0.8) {
      message = '무난한 공연이었습니다.';
    } else if (finalMultiplier >= 0.5) {
      message = '아쉬운 공연이었습니다.';
    } else {
      message = '공연이 좋지 않았습니다. 더 연습이 필요해 보입니다.';
    }

    return { money: moneyEarned, fame: fameGained, message };
  };

  const startPerformance = () => {
    const currentHour = getHour(currentTime);

    if (currentHour < 13 || currentHour > 18) {
      setError('공연은 오후 1시부터 오후 6시까지만 가능합니다.');
      return;
    }

    if (mental < 30) {
      setError('멘탈이 너무 낮아서 공연을 할 수 없습니다.');
      return;
    }

    const availableVenues = venues.filter((v) => v.minFame <= fame);
    if (availableVenues.length === 0) {
      setError('아직 공연할 수 있는 장소가 없습니다.');
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableVenues.length);
    const selectedVenue = availableVenues[randomIndex];
    setRandomVenue(selectedVenue);
    setIsModalOpen(true);
    setIsPerforming(true);
    setProgress(0);
    setCanClose(false);
    setError(null);
    setPerformanceResult(null);

    // 진행 바 애니메이션
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 2;
        if (next >= 100) {
          clearInterval(interval);
          setIsPerforming(false);
          setCanClose(true);
          // 공연 결과 계산 - selectedVenue를 직접 사용
          const result = calculatePerformanceResult(
            selectedVenue,
            teamPower,
            mental,
            fame
          );
          setPerformanceResult(result);
          return 100;
        }
        return next;
      });
    }, 100);
  };

  const completePerformance = async () => {
    if (!randomVenue || !performanceResult) return;

    let newTime = currentTime + 6;
    if (getHour(newTime) >= 24) {
      newTime = getNextDayTime(newTime);
    }

    const mentalDecreased = Math.floor(Math.random() * 15) + 10; // 10-25 감소

    try {
      await updateGameAfterPerformance(
        gameId,
        performanceResult.money,
        mentalDecreased,
        newTime,
        performanceResult.fame
      );

      setIsModalOpen(false);
      setRandomVenue(null);
      setProgress(0);
      setCanClose(false);
      setPerformanceResult(null);
      router.refresh();
    } catch (err) {
      console.error('Error updating game:', err);
      setError('공연 완료 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <button
        onClick={startPerformance}
        className='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400'
        disabled={isPerforming}
      >
        공연하기
      </button>

      {error && (
        <div className='mt-2 p-2 bg-red-100 text-red-700 rounded'>{error}</div>
      )}

      {isModalOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-lg max-w-md w-full mx-4'>
            {randomVenue && (
              <>
                <h3 className='font-bold text-xl mb-2'>{randomVenue.name}</h3>
                <p className='text-gray-600 mb-4'>{randomVenue.description}</p>

                {isPerforming ? (
                  <>
                    <p className='mb-4'>공연 진행 중...</p>
                    <div className='w-full bg-gray-200 rounded-full h-4 mb-4'>
                      <div
                        className='bg-blue-500 h-4 rounded-full transition-all duration-200'
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {performanceResult && (
                      <div className='space-y-4'>
                        <p className='text-lg font-semibold'>
                          {performanceResult.message}
                        </p>
                        <p>
                          공연 수익: {performanceResult.money.toLocaleString()}
                          만 원
                        </p>
                        <p>획득한 인지도: {performanceResult.fame}</p>
                        <div className='flex justify-end mt-4'>
                          <button
                            onClick={completePerformance}
                            className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                          >
                            완료
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
