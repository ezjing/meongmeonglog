/* =============================================================
 * 3단계 — 컴포넌트 (Component)  ※ 현재 없음 — 필요해지면 이 파일에 작성
 *
 * - 특정 컴포넌트 전용 이름입니다. 한 컴포넌트만 따로 바꿔야 할 때 씁니다.
 *   예) "버튼만 모서리를 더 둥글게", "입력창 테두리만 진하게"
 * - 언제 추가하나요?
 *   · 디자이너가 컴포넌트별 변수(button/primary/bg 등)를 관리하기 시작할 때
 *   · 같은 2단계 토큰을 쓰던 여러 컴포넌트 중 하나만 다른 값이 필요해질 때
 *   그 전에는 컴포넌트 코드의 variant(variant="soft" 등)로 처리합니다.
 * - 규칙
 *   · 값은 2단계 토큰만 참조합니다. 1단계(팔레트)를 직접 참조하지 않습니다.
 *   · 이름: {컴포넌트}{부위}{상태} camelCase   예) buttonPrimaryBgPressed
 *   · docs/design-tokens.md에도 같은 이름으로 추가합니다.
 *
 * 작성 예시
 *
 * import { colors, radius } from './semantic';
 *
 * export const buttonTokens = {
 *   primaryBg: colors.primary,
 *   primaryFg: colors.fgOnPrimary,
 *   radius: radius.controlLg,
 * } as const;
 * ============================================================= */

export {};
