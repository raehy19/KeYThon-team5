// app/game/actions.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { Game } from './page';

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

// 팀 전체 능력치 계산 유틸리티 함수
const calculateTeamPower = (game: Game): number => {
  let totalPower =
    game.main_power + (game.main_has_item ? game.main_item_power : 0);

  // mate1부터 mate4까지 순회
  for (let i = 1; i <= 4; i++) {
    const matePrefix = `mate${i}_` as const;
    const matePower = game[`${matePrefix}power` as keyof Game] as number;
    const mateHasItem = game[`${matePrefix}has_item` as keyof Game] as boolean;
    const mateItemPower = game[
      `${matePrefix}item_power` as keyof Game
    ] as number;

    if (matePower) {
      // mate가 존재하는 경우에만
      totalPower += matePower + (mateHasItem ? mateItemPower : 0);
    }
  }

  return totalPower;
};

function validateWorkConditions(time: number, mental: number) {
  const currentHour = time % 100;

  if (currentHour > 18) {
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
  let shouldResetRandomDone = false;

  if (newTimeValue % 100 >= 24) {
    newTimeValue = Math.floor(newTimeValue / 100 + 1) * 100 + 8;
    shouldResetRandomDone = true; // 날짜가 바뀌는 경우
  }

  // 업데이트 수행
  const { error } = await supabase
    .from('games')
    .update({
      money: currentGame.money + moneyToAdd,
      mental: Math.max(currentGame.mental - mentalToDecrease, 0),
      time: newTimeValue,
      random_done: shouldResetRandomDone ? false : undefined, // 날짜가 바뀌는 경우에만 false로 설정
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

  // 현재 게임 상태를 가져옵니다
  const { data: currentGame } = await supabase
    .from('games')
    .select('*') // 모든 필드를 가져오도록 변경
    .eq('id', gameId)
    .single();

  if (!currentGame) return { error: 'Game not found' };

  let shouldResetRandomDone = false;

  // 날짜가 바뀌는지 확인
  if (Math.floor(newTime / 100) > Math.floor(currentGame.time / 100)) {
    shouldResetRandomDone = true;
  }

  // 새로운 값을 계산
  const newMoney = currentGame.money + moneyEarned;
  const newMental = Math.max(currentGame.mental - mentalDecreased, 0);
  const newFame = currentGame.fame + Increasedfame;

  // 업데이트할 필드 준비
  let updateFields: Partial<Game> = {
    money: newMoney,
    mental: newMental,
    time: newTime,
    fame: newFame,
    random_done: shouldResetRandomDone ? false : undefined,
  };

  // 메인 캐릭터의 악기 내구도 감소 처리
  if (currentGame.main_has_item && currentGame.main_item_du > 0) {
    const durabilityDecrease = Math.floor(Math.random() * 15) + 5; // 5-20 감소
    const newDurability = currentGame.main_item_du - durabilityDecrease;

    if (newDurability <= 0) {
      // 악기 파괴
      updateFields = {
        ...updateFields,
        main_has_item: false,
        main_item_name: null,
        main_item_power: 0,
        main_item_du: 0,
      };
    } else {
      // 내구도만 감소
      updateFields.main_item_du = newDurability;
    }
  }

  // 팀원들의 악기 내구도 감소 처리
  for (let i = 1; i <= 4; i++) {
    const matePrefix = `mate${i}_` as const;
    const hasItem = currentGame[
      `${matePrefix}has_item` as keyof Game
    ] as boolean;
    const itemDurability = currentGame[
      `${matePrefix}item_du` as keyof Game
    ] as number;

    if (hasItem && itemDurability > 0) {
      const durabilityDecrease = Math.floor(Math.random() * 15) + 5; // 5-20 감소
      const newDurability = itemDurability - durabilityDecrease;

      if (newDurability <= 0) {
        // 악기 파괴
        updateFields = {
          ...updateFields,
          [`${matePrefix}has_item`]: false,
          [`${matePrefix}item_name`]: null,
          [`${matePrefix}item_power`]: 0,
          [`${matePrefix}item_du`]: 0,
        } as Partial<Game>;
      } else {
        // 내구도만 감소
        updateFields = {
          ...updateFields,
          [`${matePrefix}item_du`]: newDurability,
        } as Partial<Game>;
      }
    }
  }

  // 업데이트 수행
  const { error } = await supabase
    .from('games')
    .update(updateFields)
    .eq('id', gameId);

  if (error) return { error: error.message };
  return { success: true };
}
const validatePurchaseConditions = (
  time: number,
  money: number,
  price: number
) => {
  const currentHour = time % 100;

  if (currentHour < 9 || currentHour > 18) {
    return {
      isValid: false,
      error: '상점은 9시부터 18시까지만 운영합니다.',
    };
  }

  if (money < price) {
    return {
      isValid: false,
      error: '잔액이 부족합니다.',
    };
  }

  return { isValid: true };
};

export async function updateGameTime(gameId: string, newTime: number) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('games')
    .update({ time: newTime })
    .eq('id', gameId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function updateGameAfterPurchase(
  gameId: string,
  memberKey: string,
  itemName: string,
  itemPower: number,
  itemDurability: number,
  price: number,
  newTime: number
) {
  const supabase = await createClient();

  // 현재 게임 상태 확인
  const { data: currentGame } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (!currentGame) return { error: 'Game not found' };

  // 조건 검증
  const validation = validatePurchaseConditions(
    currentGame.time,
    currentGame.money,
    price
  );

  if (!validation.isValid) {
    return { error: validation.error };
  }

  // 업데이트할 필드 준비
  let updateFields: Partial<Game> = {
    money: currentGame.money - price,
    time: newTime,
  };

  // 멤버 키에 따라 업데이트할 필드 설정
  if (memberKey === 'main') {
    updateFields = {
      ...updateFields,
      main_has_item: true,
      main_item_name: itemName,
      main_item_power: itemPower,
      main_item_du: itemDurability,
    };
  } else {
    const memberIndex = memberKey.slice(4);
    const matePrefix = `mate${memberIndex}_` as const;
    updateFields = {
      ...updateFields,
      [`${matePrefix}has_item`]: true,
      [`${matePrefix}item_name`]: itemName,
      [`${matePrefix}item_power`]: itemPower,
      [`${matePrefix}item_du`]: itemDurability,
    } as Partial<Game>;
  }

  // 새로운 game state로 team_power 계산
  const newGameState = { ...currentGame, ...updateFields };
  updateFields.team_power = calculateTeamPower(newGameState);

  // 업데이트 수행
  const { error } = await supabase
    .from('games')
    .update(updateFields)
    .eq('id', gameId);

  if (error) return { error: error.message };
  return { success: true };
}

const validateRepairConditions = (
  time: number,
  money: number,
  repairCost: number,
  currentDurability: number
) => {
  const currentHour = time % 100;

  if (currentHour < 9 || currentHour > 18) {
    return {
      isValid: false,
      error: '상점은 9시부터 18시까지만 운영합니다.',
    };
  }

  if (money < repairCost) {
    return {
      isValid: false,
      error: '잔액이 부족합니다.',
    };
  }

  if (currentDurability >= 100) {
    return {
      isValid: false,
      error: '아이템이 온전한 상태입니다.',
    };
  }

  return { isValid: true };
};

export async function updateGameAfterRepair(
  gameId: string,
  memberKey: string,
  repairCost: number,
  newDurability: number,
  newTime: number
) {
  const supabase = await createClient();

  // 현재 게임 상태 확인
  const { data: currentGame } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (!currentGame) return { error: 'Game not found' };

  // 아이템 내구도 가져오기
  const currentDurability =
    memberKey === 'main'
      ? currentGame.main_item_du
      : currentGame[`mate${memberKey.slice(4)}_item_du` as keyof Game];

  // 서버 사이드에서 조건 검증
  const validation = validateRepairConditions(
    currentGame.time,
    currentGame.money,
    repairCost,
    currentDurability as number
  );

  if (!validation.isValid) {
    return { error: validation.error };
  }

  // 업데이트할 필드 준비
  let updateFields: Partial<Game> = {
    money: currentGame.money - repairCost,
    time: newTime,
  };

  // 멤버 키에 따라 업데이트할 필드 설정
  if (memberKey === 'main') {
    updateFields = {
      ...updateFields,
      main_item_du: newDurability,
    };
  } else {
    const memberIndex = memberKey.slice(4);
    updateFields = {
      ...updateFields,
      [`mate${memberIndex}_item_du`]: newDurability,
    } as Partial<Game>;
  }

  // 업데이트 수행
  const { error } = await supabase.from('games').update(updateFields);
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateGameAfterRest(gameId: string, newTime: number) {
  const supabase = await createClient();

  // 현재 게임 상태를 가져옵니다
  const { data: currentGame } = await supabase
    .from('games')
    .select('mental, time')
    .eq('id', gameId)
    .single();

  if (!currentGame) return { error: 'Game not found' };

  let shouldResetRandomDone = false;
  let finalNewTime = newTime;

  // 날짜가 바뀌는지 확인
  if (Math.floor(finalNewTime / 100) > Math.floor(currentGame.time / 100)) {
    shouldResetRandomDone = true;
  }

  // 업데이트 수행
  const { error } = await supabase
    .from('games')
    .update({
      mental: 100,
      time: finalNewTime,
      random_done: shouldResetRandomDone ? false : undefined,
    })
    .eq('id', gameId);

  if (error) return { error: error.message };
  return { success: true };
}

// 랜덤 이름 생성 함수
const generateRandomName = (): string => {
  const firstNames = [
    '김',
    '이',
    '박',
    '최',
    '정',
    '강',
    '조',
    '윤',
    '장',
    '임',
  ];
  const lastNames = [
    '준',
    '민',
    '서',
    '지',
    '현',
    '우',
    '영',
    '수',
    '호',
    '아',
  ];
  const randomFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
  const randomLast = lastNames[Math.floor(Math.random() * lastNames.length)];
  return randomFirst + randomLast + randomLast;
};

// 랜덤 포지션 생성
const generateRandomPosition = (): string => {
  const positions = ['메인보컬', '일렉기타', '드럼', '키보드', '베이스'];
  return positions[Math.floor(Math.random() * positions.length)];
};

// 랜덤 능력치 생성 (20-50)
const generateRandomPower = (): number => {
  return Math.floor(Math.random() * 30) + 20;
};

// 이벤트 성공/실패 확률 계산
const calculateEventSuccess = (probability: number = 0.7): boolean => {
  return Math.random() < probability;
};

// 랜덤 곡 제목 생성
const generateRandomSongTitle = (): string => {
  const adjectives = [
    '달콤한',
    '차가운',
    '뜨거운',
    '푸른',
    '붉은',
    '검은',
    '하얀',
  ];
  const nouns = ['사랑', '이별', '기억', '시간', '계절', '마음', '꿈'];
  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${randomAdj} ${randomNoun}`;
};

export async function updateGameAfterAdventure(
  gameId: string,
  eventType: string,
  eventParams: any
) {
  const supabase = await createClient();

  // 현재 게임 상태 확인
  const { data: currentGame } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (!currentGame) return { error: 'Game not found' };

  // 이미 오늘 모험을 완료했는지 확인
  if (currentGame.random_done) {
    return { error: '오늘은 이미 모험을 완료했습니다.' };
  }

  // 업데이트할 필드 준비
  let updateFields: Partial<Game> = {
    random_done: true,
  };

  // 이벤트 타입에 따른 처리
  switch (eventType) {
    case 'NEW_MEMBER': {
      const success = calculateEventSuccess();
      if (success && currentGame.number_of_team < 5) {
        const nextMemberIndex = currentGame.number_of_team;
        updateFields = {
          ...updateFields,
          number_of_team: currentGame.number_of_team + 1,
          [`mate${nextMemberIndex}_name`]: generateRandomName(),
          [`mate${nextMemberIndex}_job`]: generateRandomPosition(),
          [`mate${nextMemberIndex}_power`]: generateRandomPower(),
          [`mate${nextMemberIndex}_has_item`]: false,
          mental: Math.min(currentGame.mental + 10, 100),
        } as Partial<Game>;

        // 새로운 game state로 team_power 계산
        const newGameState = { ...currentGame, ...updateFields };
        updateFields.team_power = calculateTeamPower(newGameState);
      } else {
        updateFields.mental = Math.max(currentGame.mental - 10, 0);
      }
      break;
    }

    case 'INSTRUMENT_BREAK': {
      const { memberKey } = eventParams;
      const currentDurability =
        memberKey === 'main'
          ? currentGame.main_item_du
          : currentGame[`${memberKey}_item_du` as keyof Game];
      const newDurability = (currentDurability as number) - 40;

      if (memberKey === 'main') {
        updateFields = {
          ...updateFields,
          mental: Math.max(currentGame.mental - 20, 0),
          main_power: currentGame.main_power + 20,
          main_item_du: newDurability,
        };
        if (newDurability <= 0) {
          updateFields = {
            ...updateFields,
            main_has_item: false,
            main_item_name: null,
            main_item_power: 0,
            main_item_du: 0,
          };
        }
      } else {
        const memberIndex = memberKey.slice(4);
        updateFields = {
          ...updateFields,
          mental: Math.max(currentGame.mental - 20, 0),
          [`mate${memberIndex}_power`]:
            (currentGame[`mate${memberIndex}_power` as keyof Game] as number) +
            20,
          [`mate${memberIndex}_item_du`]: newDurability,
        } as Partial<Game>;

        if (newDurability <= 0) {
          updateFields = {
            ...updateFields,
            [`mate${memberIndex}_has_item`]: false,
            [`mate${memberIndex}_item_name`]: null,
            [`mate${memberIndex}_item_power`]: 0,
            [`mate${memberIndex}_item_du`]: 0,
          } as Partial<Game>;
        }
      }

      // 새로운 game state로 team_power 계산
      const newGameState = { ...currentGame, ...updateFields };
      updateFields.team_power = calculateTeamPower(newGameState);
      break;
    }

    case 'ACCIDENT': {
      const { memberKey } = eventParams;
      const memberIndex = memberKey.slice(4);
      updateFields = {
        ...updateFields,
        mental: Math.max(currentGame.mental - 30, 0),
        number_of_team: currentGame.number_of_team - 1,
        [`mate${memberIndex}_name`]: null,
        [`mate${memberIndex}_job`]: null,
        [`mate${memberIndex}_power`]: 0,
        [`mate${memberIndex}_has_item`]: false,
        [`mate${memberIndex}_item_name`]: null,
        [`mate${memberIndex}_item_power`]: 0,
        [`mate${memberIndex}_item_du`]: 0,
      } as Partial<Game>;
      break;
    }

    case 'DONATION': {
      const donationAmount = Math.floor(Math.random() * 50 + 50); // 50-100만원
      updateFields = {
        ...updateFields,
        mental: Math.min(currentGame.mental + 10, 100),
        money: currentGame.money + donationAmount,
      };
      break;
    }

    case 'HIT_SONG': {
      updateFields = {
        ...updateFields,
        mental: 100,
        fame: currentGame.fame + 100,
      };
      break;
    }

    case 'CONCERT': {
      const mentalChange = Math.floor(Math.random() * 40) - 20; // -20 ~ +20
      const fameChange = Math.floor(Math.random() * 60) - 30; // -30 ~ +30
      updateFields = {
        ...updateFields,
        mental: Math.max(0, Math.min(100, currentGame.mental + mentalChange)),
        fame: Math.max(0, currentGame.fame + fameChange),
      };
      break;
    }
  }

  // 업데이트 수행
  const { error } = await supabase
    .from('games')
    .update(updateFields)
    .eq('id', gameId);

  if (error) return { error: error.message };
  return { success: true, eventResult: updateFields };
}
export async function updateGameAfterPractice(
  gameId: string,
  score: number, // 미니게임 점수 (0-100)
  newTime: number
) {
  const supabase = await createClient();

  // 현재 게임 상태 확인
  const { data: currentGame } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (!currentGame) return { error: 'Game not found' };

  let shouldResetRandomDone = false;

  // 날짜가 바뀌는지 확인
  if (Math.floor(newTime / 100) > Math.floor(currentGame.time / 100)) {
    shouldResetRandomDone = true;
  }

  // 점수에 따른 능력치 상승 범위 결정
  const powerIncreaseRange = {
    min: Math.floor(score / 20), // 0-5
    max: Math.floor(score / 10), // 0-10
  };

  // 멘탈 감소량 계산 (점수가 높을수록 덜 감소)
  const mentalDecreaseRange = {
    min: Math.max(20 - Math.floor(score / 5), 5), // 점수가 100점이면 5~10, 0점이면 20~25
    max: Math.max(25 - Math.floor(score / 5), 10),
  };
  const mentalDecrease =
    Math.floor(
      Math.random() * (mentalDecreaseRange.max - mentalDecreaseRange.min + 1)
    ) + mentalDecreaseRange.min;

  // 업데이트할 필드 준비
  let updateFields: Partial<Game> = {
    time: newTime,
    random_done: shouldResetRandomDone ? false : undefined,
    mental: Math.max(currentGame.mental - mentalDecrease, 0), // 멘탈 감소 추가
  };

  // 메인 캐릭터 능력치 상승 및 악기 내구도 감소
  const mainPowerIncrease =
    Math.floor(
      Math.random() * (powerIncreaseRange.max - powerIncreaseRange.min + 1)
    ) + powerIncreaseRange.min;
  updateFields.main_power = currentGame.main_power + mainPowerIncrease;

  if (currentGame.main_has_item && currentGame.main_item_du > 0) {
    const durabilityDecrease = Math.floor(Math.random() * 10) + 5; // 5-15 감소
    const newDurability = currentGame.main_item_du - durabilityDecrease;

    if (newDurability <= 0) {
      // 악기 파괴
      updateFields = {
        ...updateFields,
        main_has_item: false,
        main_item_name: null,
        main_item_power: 0,
        main_item_du: 0,
      };
    } else {
      // 내구도만 감소
      updateFields.main_item_du = newDurability;
    }
  }

  // 팀원들 능력치 상승 및 악기 내구도 감소 처리
  for (let i = 1; i <= 4; i++) {
    const matePrefix = `mate${i}_` as const;
    const matePower = currentGame[`${matePrefix}power` as keyof Game] as number;
    const hasItem = currentGame[
      `${matePrefix}has_item` as keyof Game
    ] as boolean;
    const itemDurability = currentGame[
      `${matePrefix}item_du` as keyof Game
    ] as number;

    if (matePower > 0) {
      // 팀원이 존재하는 경우
      const powerIncrease =
        Math.floor(
          Math.random() * (powerIncreaseRange.max - powerIncreaseRange.min + 1)
        ) + powerIncreaseRange.min;
      updateFields = {
        ...updateFields,
        [`${matePrefix}power`]: matePower + powerIncrease,
      } as Partial<Game>;

      if (hasItem && itemDurability > 0) {
        const durabilityDecrease = Math.floor(Math.random() * 10) + 5; // 5-15 감소
        const newDurability = itemDurability - durabilityDecrease;

        if (newDurability <= 0) {
          // 악기 파괴
          updateFields = {
            ...updateFields,
            [`${matePrefix}has_item`]: false,
            [`${matePrefix}item_name`]: null,
            [`${matePrefix}item_power`]: 0,
            [`${matePrefix}item_du`]: 0,
          } as Partial<Game>;
        } else {
          // 내구도만 감소
          updateFields = {
            ...updateFields,
            [`${matePrefix}item_du`]: newDurability,
          } as Partial<Game>;
        }
      }
    }
  }

  // 팀 전체 능력치 업데이트
  const newGameState = { ...currentGame, ...updateFields };
  updateFields.team_power = calculateTeamPower(newGameState);

  // 업데이트 수행
  const { error } = await supabase
    .from('games')
    .update(updateFields)
    .eq('id', gameId);

  if (error) return { error: error.message };
  return { success: true };
}
