import { getCurrentGame, updateGameAfterWork } from './actions';
import StartGameForm from '@/components/StartGameForm';
import { formatGameTime } from '@/utils/time';
import PartTimeJob from './components/PartTimeJob';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// 팀원 정보를 보여주는 컴포넌트
function TeamMateInfo({
  number,
  mate,
}: {
  number: number;
  mate: {
    name: string | null;
    img: string | null;
    job: string | null;
    power: number;
    has_item: boolean;
    item_du: number;
    item_name: string | null;
    item_power: number;
  };
}) {
  if (!mate.name) return null;

  return (
    <div className='border rounded-lg p-4 bg-gray-50'>
      <h3 className='font-bold mb-2'>팀원 {number}</h3>
      <div className='space-y-2'>
        {mate.img && (
          <div className='w-20 h-20 relative'>
            <Image
              src={mate.img}
              alt={mate.name}
              fill
              className='object-cover rounded'
            />
          </div>
        )}
        <p>이름: {mate.name}</p>
        <p>포지션: {mate.job}</p>
        <p>능력치: {mate.power}</p>
        {mate.has_item && (
          <div className='border-t pt-2 mt-2'>
            <p>아이템: {mate.item_name}</p>
            <p>아이템 능력치: {mate.item_power}</p>
            <p>아이템 내구도: {mate.item_du}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default async function GamePage() {
  const { game, error } = await getCurrentGame();

  if (error) {
    return <div>에러가 발생했습니다: {error}</div>;
  }

  if (!game) {
    return (
      <div className='max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow'>
        <h1 className='text-2xl font-bold mb-6'>새 게임 시작</h1>
        <StartGameForm />
      </div>
    );
  }

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
    <div className='max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow'>
      {/* 게임 기본 정보 */}
      <div className='mb-8'>
        <h1 className='text-2xl font-bold mb-4'>게임 상태</h1>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-100 rounded-lg'>
          <div>
            <p className='text-gray-600'>자금</p>
            <p className='text-xl font-bold'>{game.money}만원</p>
          </div>
          <div>
            <p className='text-gray-600'>멘탈</p>
            <p className='text-xl font-bold'>{game.mental}%</p>
          </div>
          <div>
            <p className='text-gray-600'>인지도</p>
            <p className='text-xl font-bold'>{game.fame}%</p>
          </div>
          <div>
            <p className='text-gray-600'>시간</p>
            <p className='text-xl font-bold'>{formatGameTime(game.time)}</p>
          </div>
        </div>
      </div>

      {/* 액션 영역 */}
      <div className='mt-8'>
        <PartTimeJob
          gameId={game.id}
          currentTime={game.time}
          mental={game.mental}
        />
      </div>

      {/* 메인 캐릭터 정보 */}
      <div className='mb-8'>
        <h2 className='text-xl font-bold mb-4'>메인 캐릭터</h2>
        <div className='border rounded-lg p-4 bg-blue-50'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              {game.main_img && (
                <div className='w-32 h-32 relative mb-4'>
                  <Image
                    src={game.main_img}
                    alt={game.main_name}
                    fill
                    className='object-cover rounded'
                  />
                </div>
              )}
              <p className='font-bold text-lg'>{game.main_name}</p>
              <p>포지션: {game.main_job}</p>
              <p>능력치: {game.main_power}</p>
            </div>
            {game.main_has_item && (
              <div className='border-l pl-4'>
                <h3 className='font-bold mb-2'>보유 아이템</h3>
                <p>이름: {game.main_item_name}</p>
                <p>능력치: {game.main_item_power}</p>
                <p>내구도: {game.main_item_du}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 팀 정보 */}
      <div className='mb-8'>
        <h2 className='text-xl font-bold mb-4'>팀 정보</h2>
        <div className='mb-2'>
          <p>팀원 수: {game.number_of_team}</p>
          <p>팀 총 능력치: {game.team_power}</p>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {teammates.map(
            (mate, index) =>
              mate.name && (
                <TeamMateInfo key={index} number={index + 1} mate={mate} />
              )
          )}
        </div>
      </div>

      {/* 이벤트 상태 */}
      <div className='mt-4 p-4 bg-gray-100 rounded-lg'>
        <p>오늘의 랜덤 이벤트: {game.random_done ? '완료' : '미완료'}</p>
      </div>
    </div>
  );
}
