import { StyleSheet, type ViewStyle } from 'react-native';

// 색상 원본은 app.config.ts(Node)에서도 읽을 수 있도록 JSON으로 관리한다
import palette from './colors.json';

export const colors: Readonly<typeof palette> = palette;

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

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
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

/** 여러 컴포넌트가 공유하는 고정 크기 */
export const sizes = {
  /** 원형 아이콘 버튼 */
  control: 36,
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

type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

export const shadows = {
  /** 지도 위 작은 버튼 */
  sm: {
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  card: {
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  raised: {
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
  /** 로딩 카드·다이얼로그·토스트 */
  overlay: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 8,
  },
  sheet: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 10,
  },
  drawer: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 10, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 15,
    elevation: 12,
  },
  /** 산책 시작 원형 CTA */
  cta: {
    shadowColor: colors.apricot,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
    elevation: 6,
  },
} as const satisfies Record<string, ShadowStyle>;
