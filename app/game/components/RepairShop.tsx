'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getHour } from '@/utils/time';
import { updateGameTime, updateGameAfterRepair } from '../actions';
import { Game } from '../page';

interface RepairShopProps {
  game: Game;
}

interface MemberData {
  name: string | null;
  hasItem: boolean;
  itemName: string | null;
  itemPower: number;
  itemDurability: number;
}

const getMemberData = (game: Game, memberKey: string): MemberData => {
  if (memberKey === 'main') {
    return {
      name: game.main_name,
      hasItem: game.main_has_item,
      itemName: game.main_item_name,
      itemPower: game.main_item_power,
      itemDurability: game.main_item_du,
    };
  }
  const index = parseInt(memberKey.slice(4));
  return {
    name: game[`mate${index}_name` as keyof Game] as string | null,
    hasItem: game[`mate${index}_has_item` as keyof Game] as boolean,
    itemName: game[`mate${index}_item_name` as keyof Game] as string | null,
    itemPower: game[`mate${index}_item_power` as keyof Game] as number,
    itemDurability: game[`mate${index}_item_du` as keyof Game] as number,
  };
};

const calculateRepairCost = (
  itemPower: number,
  currentDurability: number
): number => {
  const durabilityToRepair = 100 - currentDurability;
  // 능력치가 높을수록, 수리해야 할 내구도가 클수록 수리비가 비쌈
  return Math.floor((durabilityToRepair * itemPower) / 12);
};

export default function RepairShop({ game }: RepairShopProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState('main');
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

    setIsModalOpen(true);
    setError(null);
  };

  const handleRepair = async () => {
    const memberData = getMemberData(game, selectedMember);

    if (!memberData.hasItem) {
      setError('수리할 아이템이 없습니다.');
      return;
    }

    if (memberData.itemDurability >= 100) {
      setError('아이템이 이미 온전한 상태입니다.');
      return;
    }

    const repairCost = calculateRepairCost(
      memberData.itemPower,
      memberData.itemDurability
    );

    if (game.money < repairCost) {
      setError('잔액이 부족합니다.');
      return;
    }

    const newTime = game.time + 3;
    try {
      await updateGameAfterRepair(
        game.id,
        selectedMember,
        repairCost,
        100, // 수리 후 내구도
        newTime
      );
      setIsModalOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error repairing item:', error);
      setError('수리 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <button
        onClick={openShop}
        className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
      >
        아이템 수리
      </button>

      {error && (
        <div className='mt-2 p-2 bg-red-100 text-red-700 rounded'>{error}</div>
      )}

      {isModalOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-lg max-w-lg w-full mx-4'>
            <h3 className='font-bold text-lg mb-4'>아이템 수리</h3>

            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700'>
                팀원 선택
              </label>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
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
              {(() => {
                const memberData = getMemberData(game, selectedMember);
                if (memberData.hasItem) {
                  const repairCost = calculateRepairCost(
                    memberData.itemPower,
                    memberData.itemDurability
                  );
                  return (
                    <>
                      <p className='text-sm text-gray-600 mt-2'>
                        현재 아이템: {memberData.itemName}
                      </p>
                      <p className='text-sm text-gray-600'>
                        능력치: {memberData.itemPower}
                      </p>
                      <p className='text-sm text-gray-600'>
                        현재 내구도: {memberData.itemDurability}/100
                      </p>
                      <p className='text-sm text-gray-600'>
                        수리 비용: {repairCost.toLocaleString()}원
                      </p>
                    </>
                  );
                }
                return (
                  <p className='text-sm text-gray-600 mt-2'>
                    수리할 아이템이 없습니다.
                  </p>
                );
              })()}
            </div>

            <div className='space-y-4'>
              {getMemberData(game, selectedMember).hasItem && (
                <button
                  onClick={handleRepair}
                  disabled={
                    getMemberData(game, selectedMember).itemDurability >= 100
                  }
                  className='w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600
                           disabled:bg-gray-400 disabled:cursor-not-allowed'
                >
                  수리하기
                </button>
              )}
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
