export function formatGameTime(time: number) {
  const day = Math.floor(time / 100) + 1;
  const hour = time % 100;
  return `${day}일차 ${hour}시`;
}

export function getHour(time: number) {
  return time % 100;
}

export function getNextDayTime(time: number) {
  const nextDay = Math.floor(time / 100) + 1;
  return nextDay * 100 + 8; // 다음날 아침 8시
}
