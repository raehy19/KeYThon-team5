// app/game/page.tsx
import { getCurrentGame } from './actions';
import StartGameForm from '@/components/StartGameForm';

export default async function GamePage() {
  const { game, error } = await getCurrentGame();

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!game) {
    return (
      <div className='max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow'>
        <h1 className='text-2xl font-bold mb-6'>새 게임 시작</h1>
        <StartGameForm />
      </div>
    );
  }

  return (
    <div className='max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow'>
      <h1 className='text-2xl font-bold mb-6'>현재 게임 상태</h1>
      <div className='space-y-4'>
        <p>이름: {game.main_name}</p>
        <p>포지션: {game.main_job}</p>
        <p>자금: {game.money}만원</p>
        <p>멘탈: {game.mental}%</p>
        <p>인지도: {game.fame}%</p>
      </div>
    </div>
  );
}
