/** 호칭이 없으면 보호자. 앱 `guardianTitleOrDefault`와 같은 말이다. */
export function guardianTitleOrDefault(title: string | null | undefined): string {
  return title?.trim() || "보호자";
}
