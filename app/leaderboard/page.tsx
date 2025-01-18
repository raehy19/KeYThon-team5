// app/leaderboard/page.tsx
import { getLeaderboard } from '../game/actions';

function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(num);
}

export default async function LeaderboardPage() {
  const { data: leaderboard, error } = await getLeaderboard();

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='alert alert-error'>
          <span>에러가 발생했습니다: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen py-8 px-4 bg-base-200'>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-4xl font-bold text-center mb-8'>명예의 전당</h1>

        <div className='overflow-x-auto bg-base-100 rounded-lg shadow'>
          <table className='table table-zebra w-full'>
            <thead>
              <tr>
                <th className='text-center'>순위</th>
                <th>플레이어</th>
                <th className='text-right'>자금</th>
                <th className='text-right'>팀 능력치</th>
                <th className='text-right'>인지도</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard?.map((entry, index) => (
                <tr key={entry.id} className={index < 3 ? 'font-bold' : ''}>
                  <td className='text-center'>
                    {index + 1}
                    {index < 3 && (
                      <span className='ml-1'>
                        {index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'}
                      </span>
                    )}
                  </td>
                  <td>{entry.player_name}</td>
                  <td className='text-right'>
                    {formatNumber(entry.money)}만원
                  </td>
                  <td className='text-right'>
                    {formatNumber(entry.team_power)}
                  </td>
                  <td className='text-right'>{formatNumber(entry.fame)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
