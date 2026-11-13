/** 기기 로컬 시간 기준 YYYY-MM-DD (UTC 기준 slice 시 한국 오전 9시 전 날짜가 하루 밀리는 문제 방지) */
export function getLocalDateKey(date: Date | string = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** 로컬 날짜 범위 [startKey 00:00, endKey 다음날 00:00)를 ISO(UTC) 문자열로 변환 */
export function getLocalDateRangeIso(
  startKey: string,
  endKey: string = startKey,
): { from: string; to: string } {
  const from = parseDateKey(startKey);
  const to = parseDateKey(endKey);
  to.setDate(to.getDate() + 1);
  return { from: from.toISOString(), to: to.toISOString() };
}
