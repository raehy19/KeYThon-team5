import React from 'react';
import Image from 'next/image';
import { getCurrentGame, updateGameAfterWork } from './actions';
import StartGameForm from '@/components/StartGameForm';
import { formatGameTime } from '@/utils/time';
import PartTimeJob from './components/PartTimeJob';

interface Character {
  name: string | null;
  img: string | null;
  job: string | null;
  power: number;
  has_item: boolean;
  item_name: string | null;
  item_power: number;
  item_du: number;
}

interface Game {
  id: string;
  money: number;
  mental: number;
  fame: number;
  team_power: number;
  time: number;
  main_name: string;
  main_img: string;
  main_job: string;
  main_power: number;
  main_has_item: boolean;
  main_item_name: string | null;
  main_item_power: number;
  main_item_du: number;
  number_of_team: number;
  random_done: boolean;
  mate1_name: string | null;
  mate1_img: string | null;
  mate1_job: string | null;
  mate1_power: number;
  mate1_has_item: boolean;
  mate1_item_name: string | null;
  mate1_item_power: number;
  mate1_item_du: number;
  mate2_name: string | null;
  mate2_img: string | null;
  mate2_job: string | null;
  mate2_power: number;
  mate2_has_item: boolean;
  mate2_item_name: string | null;
  mate2_item_power: number;
  mate2_item_du: number;
  mate3_name: string | null;
  mate3_img: string | null;
  mate3_job: string | null;
  mate3_power: number;
  mate3_has_item: boolean;
  mate3_item_name: string | null;
  mate3_item_power: number;
  mate3_item_du: number;
  mate4_name: string | null;
  mate4_img: string | null;
  mate4_job: string | null;
  mate4_power: number;
  mate4_has_item: boolean;
  mate4_item_name: string | null;
  mate4_item_power: number;
  mate4_item_du: number;
}

interface CharacterStatsProps {
  character: Character;
  isMain?: boolean;
}

const CharacterStats: React.FC<CharacterStatsProps> = ({
  character,
  isMain = false,
}) => {
  return (
    <div className='flex flex-col items-center'>
      <div className={`relative ${isMain ? 'w-40 h-40' : 'w-32 h-32'} mb-4`}>
        <Image
          src={character.img || '/api/placeholder/128/128'}
          alt={character.name || ''}
          fill
          className='object-cover'
        />
      </div>
      <div
        className={`card bg-base-100 shadow-xl ${isMain ? 'w-full max-w-md' : 'w-full'}`}
      >
        <div className='card-body p-4'>
          <h3 className={`card-title ${isMain ? 'text-2xl' : ''}`}>
            {character.name}
          </h3>
          <p>포지션: {character.job}</p>
          <p>능력치: {character.power}</p>
          {character.has_item && (
            <>
              <div className='divider my-2'></div>
              <div className='space-y-1'>
                <p className='text-sm'>아이템: {character.item_name}</p>
                <p className='text-sm'>능력치: {character.item_power}</p>
                <p className='text-sm'>내구도: {character.item_du}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
const GameContent: React.FC<{ game: Game }> = ({ game }) => {
  // 팀원 데이터 구성
  const teammates = [
    {
      name: game.mate1_name,
      img: game.mate1_img,
      job: game.mate1_job,
      power: game.mate1_power,
      has_item: game.mate1_has_item,
      item_du: game.mate1_item_du,
      item_name: game.mate1_item_name,
      item_power: game.mate1_item_power,
    },
    {
      name: game.mate2_name,
      img: game.mate2_img,
      job: game.mate2_job,
      power: game.mate2_power,
      has_item: game.mate2_has_item,
      item_du: game.mate2_item_du,
      item_name: game.mate2_item_name,
      item_power: game.mate2_item_power,
    },
    {
      name: game.mate3_name,
      img: game.mate3_img,
      job: game.mate3_job,
      power: game.mate3_power,
      has_item: game.mate3_has_item,
      item_du: game.mate3_item_du,
      item_name: game.mate3_item_name,
      item_power: game.mate3_item_power,
    },
    {
      name: game.mate4_name,
      img: game.mate4_img,
      job: game.mate4_job,
      power: game.mate4_power,
      has_item: game.mate4_has_item,
      item_du: game.mate4_item_du,
      item_name: game.mate4_item_name,
      item_power: game.mate4_item_power,
    },
  ];

  return (
    <div
      className='h-full flex flex-col justify-between bg-cover bg-center w-full max-h-[800px] p-4'
      style={{
        backgroundImage: "url('/img/background.png')",
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
      }}
    >
      {/* Top Stats Bar */}
      <div className='flex justify-between'>
        <div className='flex gap-2'>
          <div className='stats bg-base-100 shadow'>
            <div className='stat'>
              <div className='stat-title'>자금</div>
              <div className='stat-value text-primary'>{game.money}만원</div>
            </div>
          </div>
          <div className='stats bg-base-100 shadow'>
            <div className='stat'>
              <div className='stat-title'>멘탈</div>
              <div className='stat-value text-primary'>{game.mental}%</div>
            </div>
          </div>
          <div className='stats bg-base-100 shadow'>
            <div className='stat'>
              <div className='stat-title'>인지도</div>
              <div className='stat-value text-primary'>{game.fame}</div>
            </div>
          </div>
          <div className='stats bg-base-100 shadow'>
            <div className='stat'>
              <div className='stat-title'>팀 능력치</div>
              <div className='stat-value text-primary'>{game.team_power}</div>
            </div>
          </div>
        </div>
        <div className='stats bg-base-100 shadow'>
          <div className='stat'>
            <div className='stat-title'>시간</div>
            <div className='stat-value'>{formatGameTime(game.time)}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='flex items-end'>
        {/* Left Sidebar */}
        <div className='w-32 space-y-4'>
          <PartTimeJob
            gameId={game.id}
            currentTime={game.time}
            mental={game.mental}
          />
          <button className='btn btn-success w-full'>휴식하기</button>
          <button className='btn btn-warning w-full'>랜덤 이벤트</button>
          <button className='btn btn-error w-full'>공연하기</button>
        </div>

        {/* Center Content - Characters */}
        <div className='flex-1 px-8'>
          <div className='flex justify-center items-start gap-8'>
            {game.mate1_name && (
              <CharacterStats
                character={{
                  name: game.mate1_name,
                  img: game.mate1_img,
                  job: game.mate1_job,
                  power: game.mate1_power,
                  has_item: game.mate1_has_item,
                  item_name: game.mate1_item_name,
                  item_power: game.mate1_item_power,
                  item_du: game.mate1_item_du,
                }}
              />
            )}

            {/* Main Character */}
            <CharacterStats
              character={{
                name: game.main_name,
                img: game.main_img,
                job: game.main_job,
                power: game.main_power,
                has_item: game.main_has_item,
                item_name: game.main_item_name,
                item_power: game.main_item_power,
                item_du: game.main_item_du,
              }}
              isMain={true}
            />

            {game.mate2_name && (
              <CharacterStats
                character={{
                  name: game.mate2_name,
                  img: game.mate2_img,
                  job: game.mate2_job,
                  power: game.mate2_power,
                  has_item: game.mate2_has_item,
                  item_name: game.mate2_item_name,
                  item_power: game.mate2_item_power,
                  item_du: game.mate2_item_du,
                }}
              />
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className='w-32 space-y-4'>
          <button className='btn btn-accent w-full'>아이템 구매</button>
          <button className='btn btn-primary w-full'>아이템 수리</button>
          <button className='btn btn-neutral w-full'>연습하기</button>
        </div>
      </div>

      {/* 이벤트 상태 */}
      <div className='mt-4 p-4 bg-base-200 rounded-lg'>
        <p>오늘의 랜덤 이벤트: {game.random_done ? '완료' : '미완료'}</p>
      </div>
    </div>
  );
};

export default async function GamePage() {
  const { game, error } = await getCurrentGame();

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='alert alert-error'>
          <span>에러가 발생했습니다: {error}</span>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='card w-96 bg-base-100 shadow-xl'>
          <div className='card-body'>
            <h2 className='card-title'>새 게임 시작</h2>
            <StartGameForm />
          </div>
        </div>
      </div>
    );
  }

  return <GameContent game={game} />;
}
