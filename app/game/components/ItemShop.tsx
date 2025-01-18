'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getHour } from '@/utils/time';
import { updateGameAfterPurchase, updateGameTime } from '../actions';
import { Game } from '../page';

interface ItemShopProps {
  game: Game;
}

interface Item {
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

const getItemName = (job: string | null): string[] => {
  switch (job) {
    case '메인보컬':
      return [
        '뉴만 U87 스튜디오 마이크',
        '쇼어 SM7B 방송용 마이크',
        '젠하이저 e935 라이브 마이크',
        '오디오테크니카 AT2020 USB 마이크',
        'AKG C414 컨덴서 마이크',
        '로데 NT1-A 보컬 마이크',
        '블루 예티 X 프로 마이크',
        'SE Electronics sE2200 스튜디오 마이크',
        '워름 WA-47 튜브 마이크',
        '아포지 HypeMiC USB 마이크',
      ];
    case '일렉기타':
      return [
        '깁슨 레스폴 스탠다드',
        '펜더 스트라토캐스터 프로페셔널',
        'PRS 커스텀 24',
        '아이바네즈 RG 프리스티지',
        '깁슨 SG 스탠다드',
        '잭슨 솔로이스트 프로',
        '구스 베넷 긴스버그 시그니처',
        '칼 톰슨 CT624 커스텀',
        'ESP E-II 호라이즌',
        '샤벨 프로 모드 DK24',
      ];
    case '드럼':
      return [
        '펄 마스터스 메이플 리저브',
        '타마 스타클래식 버블링햄',
        'DW 콜렉터스 시리즈 메이플',
        '루드윅 클래식 메이플',
        '그레치 브로드케스터',
        '야마하 리코딩 커스텀',
        '소노 마티니 빈티지',
        '메이플워크스 커스텀 시리즈',
        '에이드리언 드럼웍스 스페셜',
        '캔옵스 뉴요커 시리즈',
      ];
    case '키보드':
      return [
        '노드 스테이지 3 콤팩트',
        '롤랜드 팬텀 8',
        '야마하 몬태지 8',
        '코르그 크로노스 2',
        '데이브 스미스 프로펫 Rev2',
        '모그 원',
        '쿠르츠바일 PC4',
        '아티uria 폴리브루트',
        '노베이션 서밋',
        '롤랜드 주피터 X',
      ];
    case '베이스':
      return [
        '펜더 프리시전 엘리트',
        '뮤직맨 스팅레이 5 HH',
        '워윅 스트리머 LX',
        '스페터 유로 5 LX',
        '포데라 임페리얼 커스텀 5',
        'MTD 킹스턴 Z5',
        '레이크우드 스카이라인',
        '델라 크루즈 USBL',
        '사들러 빈티지 5',
        '알렘빅 에센스 NT',
      ];
    default:
      return [
        '야마하 입문용 기타',
        '롤랜드 디지털 피아노',
        '케이스 우쿨렐레',
        '펄 스네어 드럼',
        '쉬어 SM58 마이크',
        '카시오 키보드',
        '칼림바 17키',
        '에피폰 베이스',
        '짐블 전자드럼',
        '코르그 미니 신디사이저',
      ];
  }
};

const generateItems = (job: string | null): Item[] => {
  const names = getItemName(job);
  return names.map((name) => {
    const power = Math.floor(Math.random() * 200) + 10;
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

export default function ItemShop({ game }: ItemShopProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState('main');
  const [items, setItems] = useState<Item[]>([]);
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
    setItems(generateItems(memberData.job));
    setIsModalOpen(true);
    setError(null);
  };

  const handlePurchase = async (item: Item) => {
    if (game.money < item.price) {
      setError('잔액이 부족합니다.');
      return;
    }

    const newTime = game.time + 3;
    try {
      await updateGameAfterPurchase(
        game.id,
        selectedMember,
        item.name,
        item.power,
        100, // 내구도
        item.price,
        newTime
      );
      setIsModalOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error purchasing item:', error);
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
                  setItems(generateItems(memberData.job));
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
                현재 잔액: {game.money.toLocaleString()}만 원
              </p>
              {getMemberData(game, selectedMember).hasItem && (
                <p className='text-sm text-gray-600'>
                  현재 장착 중: {getMemberData(game, selectedMember).itemName}
                  (능력치: {getMemberData(game, selectedMember).itemPower})
                </p>
              )}
            </div>

            <div className='space-y-4'>
              {items.map((item, index) => (
                <div
                  key={index}
                  className='border p-4 rounded flex justify-between items-center'
                >
                  <div>
                    <p className='font-medium'>{item.name}</p>
                    <p className='text-sm text-gray-600'>
                      능력치: {item.power}
                    </p>
                    <p className='text-sm text-gray-600'>
                      가격: {item.price.toLocaleString()}만 원
                    </p>
                  </div>
                  <button
                    onClick={() => handlePurchase(item)}
                    disabled={game.money < item.price}
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
