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

function validateWorkConditions(time: number, mental: number) {
  const currentHour = time % 100;

  if (currentHour >= 18) {
    return {
      isValid: false,
      error: '너무 늦은 시간이라 알바를 할 수 없습니다.',
    };
  }

  if (mental < 30) {
    return {
      isValid: false,
      error: '멘탈이 너무 낮아서 알바를 할 수 없습니다.',
    };
  }

  return { isValid: true };
}

export async function updateGameAfterWork(
  gameId: string,
  moneyEarned: number,
  mentalDecreased: number,
  newTime: number
) {
  const supabase = await createClient();

  // 현재 게임 상태 확인
  const { data: currentGame } = await supabase
    .from('games')
    .select('money, mental, time')
    .eq('id', gameId)
    .single();

  if (!currentGame) return { error: 'Game not found' };

  // 서버 사이드에서 조건 검증
  const validation = validateWorkConditions(
    currentGame.time,
    currentGame.mental
  );
  if (!validation.isValid) {
    return { error: validation.error };
  }

  // 클라이언트에서 받은 값이 아닌, 서버에서 새로 계산
  const moneyToAdd = Math.floor(Math.random() * 20) + 30; // 30~50만원
  const mentalToDecrease = Math.floor(Math.random() * 10) + 5; // 5~15 감소
  const timeToAdd = 6;

  let newTimeValue = currentGame.time + timeToAdd;
  if (newTimeValue % 100 >= 24) {
    newTimeValue = Math.floor(newTimeValue / 100 + 1) * 100 + 8;
  }

  // 업데이트 수행
  const { error } = await supabase
    .from('games')
    .update({
      money: currentGame.money + moneyToAdd,
      mental: Math.max(currentGame.mental - mentalToDecrease, 0),
      time: newTimeValue,
    })
    .eq('id', gameId);

  if (error) return { error: error.message };
  return { success: true };
}


export async function updateGameAfterPerformance(
  gameId: string,
  moneyEarned: number,
  mentalDecreased: number,
  newTime: number,
  Increasedfame: number

) {
  const supabase = await createClient();

  // 먼저 현재 게임 상태를 가져옵니다
  const { data: currentGame } = await supabase
    .from('games')
    .select('money, mental, fame')
    .eq('id', gameId)
    .single();

  if (!currentGame) return { error: 'Game not found' };

  // 새로운 값을 계산
  const newMoney = currentGame.money + moneyEarned;
  const newMental = Math.max(currentGame.mental - mentalDecreased, 0); // 멘탈이 0 이하로 내려가지 않도록
  const newFame = currentGame.fame + Increasedfame;


  // 업데이트 수행
  const { error } = await supabase
    .from('games')
    .update({
      money: newMoney,
      mental: newMental,
      time: newTime,
      fame: newFame,

    })
    .eq('id', gameId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function updateGameAfterRest(
  gameId: string,
  newTime: number,


) {
  const supabase = await createClient();

  // 먼저 현재 게임 상태를 가져옵니다
  const { data: currentGame } = await supabase
    .from('games')
    .select('mental')
    .eq('id', gameId)
    .single();

  if (!currentGame) return { error: 'Game not found' };

  // 새로운 값을 계산

  const newMental = 100;



  // 업데이트 수행
  const { error } = await supabase
    .from('games')
    .update({
      
      mental: newMental,
      time: newTime,
     

    })
    .eq('id', gameId);

  if (error) return { error: error.message };
  return { success: true };
}
