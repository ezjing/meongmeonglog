/* =============================================================
 * 3단계 — 컴포넌트 (Component)
 *
 * - 특정 컴포넌트 전용 이름입니다. 한 컴포넌트만 따로 바꿔야 할 때 씁니다.
 * - 규칙
 *   · 값은 2단계 토큰만 참조합니다. 1단계(팔레트)를 직접 참조하지 않습니다.
 *   · 이름: {컴포넌트}Tokens.{변형}.{부위}
 *   · docs/design-tokens.md에도 같은 이름으로 추가합니다.
 * ============================================================= */

import { colors } from './semantic';

interface ButtonColorTokens {
  bg: string;
  fg: string;
  border?: string;
}

/**
 * 버튼 역할별 색 (역할 설명: docs/design-tokens.md "버튼 역할")
 * primary 주요 행동 · secondary 보조 행동 · danger / dangerFilled 위험 행동 · text 텍스트 버튼 · 외부 서비스
 */
export const buttonTokens = {
  primary: { bg: colors.primary, fg: colors.fgOnPrimary },
  secondary: { bg: colors.surface, fg: colors.fg, border: colors.border },
  danger: { bg: colors.surface, fg: colors.danger, border: colors.danger },
  dangerFilled: { bg: colors.danger, fg: colors.fgOnPrimary },
  text: { bg: 'transparent', fg: colors.fgMuted },
  kakao: { bg: colors.kakao, fg: colors.kakaoFg },
  naver: { bg: colors.naver, fg: colors.naverFg },
  instagram: { bg: colors.instagram, fg: colors.fgOnPrimary },
} as const satisfies Record<string, ButtonColorTokens>;

export type ButtonVariant = keyof typeof buttonTokens;
