// app/game/components/InstrumentShop.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getHour } from '@/utils/time';
import { updateGameAfterPurchase, updateGameTime } from '../actions';
import { Game } from '../page';

interface InstrumentShopProps {
  game: Game;
}

interface Instrument {
  name: string;
  power: number;
  price: number;
}

interface MemberData {
  name: string | null;
  job: string | null;
  hasItem: boolean;
  itemName: string | null;
  itemPower: number;
}

const getInstrumentName = (job: string | null): string[] => {
  switch (job) {
    case '보컬':
      return ['프리미엄 마이크', '스튜디오 마이크', '무선 마이크'];
    case '기타':
      return ['일렉트릭 기타', '어쿠스틱 기타', '베이스 기타'];
    case '드럼':
      return ['전자 드럼', '어쿠스틱 드럼', '프리미엄 드럼'];
    case '키보드':
      return ['신디사이저', '디지털 피아노', '스테이지 피아노'];
    case '베이스':
      return ['일렉트릭 베이스', '어쿠스틱 베이스', '프리미엄 베이스'];
    default:
      return ['기본 악기 1', '기본 악기 2', '기본 악기 3'];
  }
};

const generateInstruments = (job: string | null): Instrument[] => {
  const names = getInstrumentName(job);
  return names.map((name) => {
    const power = Math.floor(Math.random() * 30) + 20; // 20-50 power
    return {
      name,
      power,
      price: power * 3, // power에 비례한 가격
    };
  });
};

const getMemberData = (game: Game, memberKey: string): MemberData => {
  if (memberKey === 'main') {
    return {
      name: game.main_name,
      job: game.main_job,
      hasItem: game.main_has_item,
      itemName: game.main_item_name,
      itemPower: game.main_item_power,
    };
  }
  const index = parseInt(memberKey.slice(4));
  return {
    name: game[`mate${index}_name` as keyof Game] as string | null,
    job: game[`mate${index}_job` as keyof Game] as string | null,
    hasItem: game[`mate${index}_has_item` as keyof Game] as boolean,
    itemName: game[`mate${index}_item_name` as keyof Game] as string | null,
    itemPower: game[`mate${index}_item_power` as keyof Game] as number,
  };
};

export default function InstrumentShop({ game }: InstrumentShopProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState('main');
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [error, setError] = useState<string | null>(null);

  const closeShop = async () => {
    const newTime = game.time + 3;
    try {
      await updateGameTime(game.id, newTime);
      setIsModalOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error updating time:', error);
      setError('시간 업데이트 중 오류가 발생했습니다.');
    }
  };

  const openShop = () => {
    const currentHour = getHour(game.time);

    if (currentHour < 9 || currentHour > 18) {
      setError('상점은 9시부터 18시까지만 운영합니다.');
      return;
    }

    const memberData = getMemberData(game, selectedMember);
    setInstruments(generateInstruments(memberData.job));
    setIsModalOpen(true);
    setError(null);
  };

  const handlePurchase = async (instrument: Instrument) => {
    if (game.money < instrument.price) {
      setError('잔액이 부족합니다.');
      return;
    }

    const newTime = game.time + 3;
    try {
      await updateGameAfterPurchase(
        game.id,
        selectedMember,
        instrument.name,
        instrument.power,
        100, // 내구도
        instrument.price,
        newTime
      );
      setIsModalOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error purchasing instrument:', error);
      setError('구매 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <button
        onClick={openShop}
        className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
      >
        아이템 구매
      </button>

      {error && (
        <div className='mt-2 p-2 bg-red-100 text-red-700 rounded'>{error}</div>
      )}

      {isModalOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-lg max-w-lg w-full mx-4'>
            <h3 className='font-bold text-lg mb-4'>아이템 구매</h3>

            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700'>
                팀원 선택
              </label>
              <select
                value={selectedMember}
                onChange={(e) => {
                  setSelectedMember(e.target.value);
                  const memberData = getMemberData(game, e.target.value);
                  setInstruments(generateInstruments(memberData.job));
                }}
                className='mt-1 block w-full rounded border-gray-300'
              >
                <option value='main'>{game.main_name}</option>
                {[1, 2, 3, 4].map((i) => {
                  const mateName = game[`mate${i}_name` as keyof Game];
                  return mateName ? (
                    <option key={i} value={`mate${i}`}>
                      {mateName}
                    </option>
                  ) : null;
                })}
              </select>
            </div>

            <div className='mb-4'>
              <p className='text-sm text-gray-600'>
                현재 잔액: {game.money.toLocaleString()}원
              </p>
              {getMemberData(game, selectedMember).hasItem && (
                <p className='text-sm text-gray-600'>
                  현재 장착 중: {getMemberData(game, selectedMember).itemName}
                  (능력치: {getMemberData(game, selectedMember).itemPower})
                </p>
              )}
            </div>

            <div className='space-y-4'>
              {instruments.map((instrument, index) => (
                <div
                  key={index}
                  className='border p-4 rounded flex justify-between items-center'
                >
                  <div>
                    <p className='font-medium'>{instrument.name}</p>
                    <p className='text-sm text-gray-600'>
                      능력치: {instrument.power}
                    </p>
                    <p className='text-sm text-gray-600'>
                      가격: {instrument.price.toLocaleString()}원
                    </p>
                  </div>
                  <button
                    onClick={() => handlePurchase(instrument)}
                    disabled={game.money < instrument.price}
                    className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600
                             disabled:bg-gray-400 disabled:cursor-not-allowed'
                  >
                    구매하기
                  </button>
                </div>
              ))}
            </div>

            <div className='mt-4 flex justify-end'>
              <button
                onClick={closeShop}
                className='px-4 py-2 text-gray-600 hover:text-gray-800'
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
