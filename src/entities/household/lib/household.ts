import { WEB_ORIGIN } from '@/shared/config/links';
import { AppError } from '@/shared/lib/AppError';

import type { HouseholdGroup } from '../model/types';

const INVITE_WARNING: Record<string, string> = {
  invite_rate_limited: '코드를 너무 많이 틀렸어요. 1시간 뒤에 다시 시도해 주세요.',
  invite_invalid: '코드가 맞지 않거나 만료됐어요',
  invite_already_member: '이미 이 집의 가족이에요',
  invite_household_full: '가족은 최대 10명까지 함께할 수 있어요',
};

const INVITE_CODES = [
  'invite_rate_limited',
  'invite_invalid',
  'invite_already_member',
  'invite_household_full',
  'invite_not_admin',
  'invite_create_failed',
] as const;

export function normalizeInviteCode(raw: string): string {
  return raw.replace(/\s/g, '').toUpperCase();
}

export function inviteWarningMessage(error: unknown): string | null {
  if (!(error instanceof AppError)) return null;
  return INVITE_WARNING[error.code] ?? null;
}

export function throwHouseholdRpcError(error: { message: string }, fallback: string): never {
  const code = INVITE_CODES.find((item) => error.message.includes(item)) ?? fallback;
  throw new AppError(code, error.message);
}

/** 가입할 때 생긴 집. 구성원으로 들어간 시각이 가장 이른 집이다. */
export function ownHouseholdId(groups: HouseholdGroup[]): string | null {
  const [first] = [...groups].sort((a, b) => a.myJoinedAt.localeCompare(b.myJoinedAt));
  return first?.householdId ?? null;
}

export function isHouseholdAdmin(groups: HouseholdGroup[], householdId: string): boolean {
  return groups.some((group) => group.householdId === householdId && group.myRole === 'admin');
}

export function formatHouseholdTitle(guardianTitle: string | null | undefined): string {
  const title = guardianTitle?.trim() || '보호자';
  return `${title}님의 집`;
}

export function formatInviteAcceptTitle(guardianTitle: string | null | undefined): string {
  const title = guardianTitle?.trim() || '보호자';
  return `${title}님의 집이에요`;
}

export function formatInviteShareMessage(guardianTitle: string | null | undefined, code: string): string {
  const title = guardianTitle?.trim() || '보호자';
  return `${title}님이 멍멍로그 가족으로 초대했어요. 앱이나 ${WEB_ORIGIN} 에서 초대 코드 ${code}를 입력해 주세요. (7일 안에)`;
}
