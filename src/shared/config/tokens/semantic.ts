/* =============================================================
 * 2단계 — 의미 (Semantic)
 * - 용도에 따른 이름입니다. 화면 코드(컴포넌트·페이지)는 이 단계의 토큰만 사용합니다.
 * - 값은 1단계(brand, neutral, palette, radiusScale)만 참조합니다.
 * - 구성: (1) 색 Light 값
 *         (2) 색 Dark 값 — 자리만 있음 (앱이 라이트 모드 고정)
 *         (3) 모서리 · (4) 그림자 · (5) 고정 크기
 * 명세: docs/design-tokens.md
 * ============================================================= */

import type { ViewStyle } from 'react-native';

import { brand, neutral, palette, radiusScale } from './primitive';

/* 2단계 (1) — 색 Light 값 */
export const lightColors = {
  /* 배경 / 면 */
  bg: neutral[200],
  surface: palette.white,
  /** 흰 면(시트·드로어) 안에서 한 톤 들어간 영역 */
  surfaceMuted: neutral[200],
  /** 진한 면: 기본 토스트, 선택된 칩·버튼, 카메라 배지 */
  surfaceInverse: neutral[900],
  /** 사진·아바타가 아직 없을 때 자리 배경 */
  surfacePlaceholder: brand[300],
  /** 다이얼로그·시트 뒤 배경 */
  overlay: palette.ink900Alpha46,
  /** 사진 위 작은 버튼 배경 */
  overlayStrong: palette.ink900Alpha72,
  /** 사진 위 태그 배경 */
  scrim: palette.blackAlpha35,
  /** 사진 크게 보기 배경 */
  scrimStrong: palette.blackAlpha85,

  /* 글자 */
  fg: neutral[900],
  fgSecondary: neutral[600],
  fgMuted: neutral[400],
  /** 입력창 placeholder */
  fgSubtle: neutral[400],
  /** 색이 칠해진 면(주황·초록·빨강) 위 글자 */
  fgOnPrimary: palette.white,
  /** 진한 면·사진 위 글자 */
  fgInverse: palette.white,
  /** 사진 위 표시(캐러셀 점) */
  fgOnMedia: palette.white,
  fgOnMediaMuted: palette.whiteAlpha50,

  /* 테두리 */
  border: neutral[300],
  /** 외곽선 버튼, 선택된 칩·버튼 테두리 */
  borderStrong: neutral[900],

  /* 브랜드 */
  primary: brand[500],
  /** 주황 글자·아이콘·강조 테두리 */
  primaryFg: brand[600],
  /** 오늘의 한마디 카드 등 연한 주황 면 */
  primarySubtle: brand[100],

  /* 상태 */
  success: palette.moss500,
  /** 사용법 안내·입력값 확인·권한 필요 (흰 굵은 글자와 함께 쓸 때 대비를 위해 한 톤 진한 주황) */
  warning: brand[600],
  danger: palette.red500,

  /* 외부 서비스 브랜드 색 (각 서비스 가이드 값 고정) */
  kakao: palette.kakaoYellow,
  kakaoFg: palette.blackAlpha85,
  kakaoSymbol: palette.black,
  naver: palette.naverGreen,
  naverFg: palette.white,
  instagram: palette.instagramPink,

  /* 그림자 색 */
  shadow: neutral[900],
  shadowStrong: palette.black,
} as const;

export type ColorToken = keyof typeof lightColors;

/* 2단계 (2) — 색 Dark 값 (Light와 다른 것만 덮어씀)
 * 앱이 app.json `userInterfaceStyle: "light"`로 고정돼 있어 아직 비워 둔다.
 * 다크 모드를 지원할 때 여기에 값을 채우고, useColorScheme으로 lightColors와 합쳐 쓴다. */
export const darkColors: Partial<Record<ColorToken, string>> = {};

/** 현재 앱이 쓰는 색 (라이트 고정) */
export const colors = lightColors;

/* 2단계 (3) — 모서리 */
export const radius = {
  /** 작은 요소: 아이콘 칸, 캘린더 날짜 칸, 사진 썸네일 */
  controlSm: radiusScale.sm,
  /** 입력창, 선택 버튼, 소셜 로그인 버튼, 시트 안 버튼 */
  control: radiusScale.md,
  /** 기본 버튼, 다이얼로그 버튼 */
  controlLg: radiusScale.lg,
  /** 작은 안내 박스(오늘의 한마디 등), 일기 썸네일 */
  cardSm: radiusScale.md,
  /** 카드, 토스트, 사진 미리보기 */
  card: radiusScale.lg,
  /** 강조 카드: 공유 카드, 환영 말풍선, 로그인 로고 */
  cardLg: radiusScale.xl,
  /** 다이얼로그, 바텀시트, 로딩 카드 */
  modal: radiusScale.xl,
  /** 원형·알약 모양 */
  full: radiusScale.full,
} as const;

/* 2단계 (4) — 그림자 */
type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

export const shadows = {
  /** 지도 위 작은 버튼 */
  control: {
    shadowColor: lightColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  card: {
    shadowColor: lightColors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  /** 강조 카드: 공유 카드, 환영 말풍선 */
  raised: {
    shadowColor: lightColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
  /** 로딩 카드, 다이얼로그, 토스트 */
  modal: {
    shadowColor: lightColors.shadowStrong,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 8,
  },
  sheet: {
    shadowColor: lightColors.shadowStrong,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 10,
  },
  drawer: {
    shadowColor: lightColors.shadowStrong,
    shadowOffset: { width: 10, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 15,
    elevation: 12,
  },
  /** 산책 시작 원형 버튼 */
  cta: {
    shadowColor: lightColors.primary,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
    elevation: 6,
  },
} as const satisfies Record<string, ShadowStyle>;

/* 2단계 (5) — 여러 컴포넌트가 공유하는 고정 크기 */
export const sizes = {
  /** 원형 아이콘 버튼 (앱바 뒤로·공유·메뉴, 지도 내 위치 버튼) */
  iconButton: 36,
} as const;
