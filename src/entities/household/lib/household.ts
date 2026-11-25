import { guardianTitleOrDefault } from '@/entities/guardian/@x/household';
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
  'invite_failed',
] as const;

const INVITE_FAILED_MESSAGE = '초대 코드를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.';

export function normalizeInviteCode(raw: string): string {
  return raw.replace(/\s/g, '').toUpperCase();
}

export function inviteWarningMessage(error: unknown): string | null {
  if (!(error instanceof AppError)) return null;
  return INVITE_WARNING[error.code] ?? null;
}

export function inviteFailedMessage(error: unknown): string | null {
  if (!(error instanceof AppError) || error.code !== 'invite_failed') return null;
  return INVITE_FAILED_MESSAGE;
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

/**
 * 기록한 사람이거나 그 산책 집의 관리자.
 * SQL `is_walk_recorder_or_admin`(011_walk_companions.sql)과 같다.
 */
export function canManageRecord(
  recordedBy: string | null | undefined,
  householdId: string | null | undefined,
  userId: string | null,
  groups: HouseholdGroup[] | null | undefined,
): boolean {
  return (
    (recordedBy != null && recordedBy === userId) ||
    (householdId != null && groups != null && isHouseholdAdmin(groups, householdId))
  );
}

/**
 * 다른 가족이 있는 관리자 집. 탈퇴하려면 그 집의 강아지를 맡을 가족을 골라야 한다.
 * SQL `transfer_household_admins`(010_households.sql)와 같다.
 */
export function householdsNeedingSuccessor(
  groups: HouseholdGroup[],
  userId: string | null,
): HouseholdGroup[] {
  return groups.filter(
    (group) => group.myRole === 'admin' && group.members.some((member) => member.userId !== userId),
  );
}

export function formatHouseholdTitle(guardianTitle: string | null | undefined): string {
  return `${guardianTitleOrDefault(guardianTitle)}님의 집`;
}

export function formatInviteAcceptTitle(guardianTitle: string | null | undefined): string {
  return `${guardianTitleOrDefault(guardianTitle)}님의 집이에요`;
}

export function formatInviteShareMessage(
  guardianTitle: string | null | undefined,
  code: string,
): string {
  const title = guardianTitleOrDefault(guardianTitle);
  return `${title}님이 멍멍로그 가족으로 초대했어요. 앱이나 ${WEB_ORIGIN} 에서 초대 코드 ${code}를 입력해 주세요. (7일 안에)`;
}
