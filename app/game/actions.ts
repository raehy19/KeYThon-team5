// app/game/actions.ts
'use server';

import { createClient } from '@/utils/supabase/server';

export async function getCurrentGame() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_playing', true)
    .maybeSingle();

  // 게임이 없는 경우는 에러가 아닌 정상 케이스
  if (error) return { error: error.message };
  if (!data) return { game: null }; // 게임이 없는 경우

  return { game: data };
}

export async function startNewGame(gameData: {
  main_name: string;
  main_job: string;
  main_img: string;
  main_power?: number;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // 기존 게임이 있다면 is_playing을 false로 변경
  const { error: updateError } = await supabase
    .from('games')
    .update({ is_playing: false })
    .eq('user_id', user.id)
    .eq('is_playing', true);

  if (updateError) return { error: updateError.message };

  // 새 게임 생성
  const { data: game, error } = await supabase
    .from('games')
    .insert([
      {
        user_id: user.id,
        ...gameData,
        main_power: gameData.main_power || 10,
        team_power: gameData.main_power || 10,
      },
    ])
    .select()
    .single();

  if (error) return { error: error.message };
  return { game };
}

export async function updateGameAfterWork(
  gameId: string,
  moneyEarned: number,
  mentalDecreased: number,
  newTime: number
) {
  const supabase = await createClient();

  // 먼저 현재 게임 상태를 가져옵니다
  const { data: currentGame } = await supabase
    .from('games')
    .select('money, mental')
    .eq('id', gameId)
    .single();

  if (!currentGame) return { error: 'Game not found' };

  // 새로운 값을 계산
  const newMoney = currentGame.money + moneyEarned;
  const newMental = Math.max(currentGame.mental - mentalDecreased, 0); // 멘탈이 0 이하로 내려가지 않도록

  // 업데이트 수행
  const { error } = await supabase
    .from('games')
    .update({
      money: newMoney,
      mental: newMental,
      time: newTime,
    })
    .eq('id', gameId);

  if (error) return { error: error.message };
  return { success: true };
}
