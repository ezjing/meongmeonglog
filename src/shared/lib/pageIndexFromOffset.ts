/** 가로 페이징 스크롤의 현재 칸. 결과는 0 이상 count - 1 이하다. */
export function pageIndexFromOffset(offsetX: number, pageWidth: number, count: number): number {
  if (count <= 0 || pageWidth <= 0) return 0;
  const index = Math.round(offsetX / pageWidth);
  if (!Number.isFinite(index)) return 0;
  return Math.min(Math.max(index, 0), count - 1);
}
