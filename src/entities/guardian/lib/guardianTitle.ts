/** 호칭이 없으면 보호자. 화면과 일기 호칭이 같은 말을 쓰게 한다. */
export function guardianTitleOrDefault(title: string | null | undefined): string {
  return title?.trim() || '보호자';
}
