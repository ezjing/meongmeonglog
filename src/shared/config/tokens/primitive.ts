/* =============================================================
 * 1단계 — 팔레트 (Primitive)
 * - 의미 없는 원재료 값입니다. 화면 코드에서 직접 쓰지 않습니다. (lint 에러)
 * - 색 원본은 palette.json (app.config.ts에서도 읽어야 해서 JSON)
 * - 구성: (1) 브랜드 선택 — 이 앱이 쓸 팔레트를 고르는 곳
 *         (2) 모서리 크기 단계
 * 명세: docs/design-tokens.md
 * ============================================================= */

import palette from './palette.json';

export { palette };

/* 1단계 (1) ▼▼▼ 브랜드 — 색 테마를 바꾸려면 이 블록만 바꾸세요 ▼▼▼
 * 2단계 토큰은 모두 이 값을 참조하므로, 여기만 바꾸면 앱 전체가 바뀝니다. */

/** 브랜드 색 (주황 계열) */
export const brand = {
  100: palette.apricot100,
  300: palette.apricot300,
  500: palette.apricot500,
  600: palette.apricot600,
} as const;

/** 중립색: 밝은 쪽은 크림(배경·선), 어두운 쪽은 잉크(글자) */
export const neutral = {
  200: palette.cream200,
  300: palette.cream300,
  400: palette.ink400,
  600: palette.ink600,
  900: palette.ink900,
} as const;
/* ▲▲▲ 브랜드 끝 ▲▲▲ */

/* 1단계 (2) — 모서리 크기 단계 (2단계 radius가 용도별로 참조) */
export const radiusScale = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;
