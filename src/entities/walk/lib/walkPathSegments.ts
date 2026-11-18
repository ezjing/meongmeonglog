import type { WalkCoord } from '../model/walkSessionStorage';

/**
 * 경로를 끊긴 곳(segmentStart)마다 나눈다. 지도는 구간마다 선을 따로 그려,
 * 기록되지 않은 구간(웹에서 화면이 꺼졌던 동안 등)을 직선으로 잇지 않는다.
 */
export function splitWalkPath(path: WalkCoord[]): WalkCoord[][] {
  const segments: WalkCoord[][] = [];
  for (const coord of path) {
    if (coord.segmentStart || segments.length === 0) {
      segments.push([coord]);
    } else {
      segments[segments.length - 1].push(coord);
    }
  }
  return segments;
}
