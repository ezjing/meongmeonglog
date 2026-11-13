import { StyleSheet } from 'react-native';

/**
 * 화면 코드가 쓰는 디자인 토큰 입구 (명세: docs/design-tokens.md)
 * - 색·모서리·그림자·고정 크기: 2단계 의미 토큰 (tokens/semantic.ts)
 * - 간격·글자 크기 등 아래 스케일: 의미 없이 단계만 있는 기본값으로 화면에서 직접 쓴다
 * - 1단계 팔레트(tokens/primitive.ts, palette.json)는 화면 코드에서 import하지 않는다
 */
export { colors, radius, shadows, sizes } from './tokens/semantic';

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  ms: 12,
  md: 16,
  ml: 20,
  lg: 24,
  xl: 32,
} as const;

export const fontSize = {
  xxs: 8,
  xs: 10,
  sm: 11,
  md: 12,
  base: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  display: 22,
  displayLg: 24,
  /** 산책 타이머 등 큰 숫자 */
  hero: 32,
} as const;

export const iconSize = {
  sm: 16,
  md: 18,
  lg: 20,
} as const;

/** 작은 터치 대상의 터치 영역 확장 */
export const hitSlop = 8;

export const zIndex = {
  base: 1,
  raised: 2,
  overlay: 10,
  toast: 100,
} as const;

/** 이모지·아이콘 글리프 전용 크기 */
export const emojiSize = {
  sm: 28,
  md: 32,
  lg: 36,
  xl: 96,
} as const;

export const fontWeight = {
  light: '300',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export const lineHeight = {
  sm: 16,
  md: 20,
  lg: 24,
} as const;

export const borderWidth = {
  hairline: StyleSheet.hairlineWidth,
  thin: 1,
  medium: 1.5,
  thick: 2,
  heavy: 4,
} as const;

export const opacity = {
  pressed: 0.85,
  disabled: 0.5,
  subtle: 0.3,
  dim: 0.94,
} as const;

export const scale = {
  pressed: 0.96,
} as const;
