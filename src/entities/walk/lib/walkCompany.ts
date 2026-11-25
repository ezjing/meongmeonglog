import { josa } from '@/shared/lib/josa';

import type { WalkPerson } from '../model/types';

const WITHDRAWN_FAMILY_LABEL = '탈퇴한 가족';
const GUARDIAN_FALLBACK_LABEL = '보호자';

/** 탈퇴한 사람은 탈퇴한 가족, 호칭이 없으면 보호자. */
function walkPersonLabel(person: WalkPerson): string {
  if (!person.userId) return WITHDRAWN_FAMILY_LABEL;
  return person.title?.trim() || GUARDIAN_FALLBACK_LABEL;
}

/**
 * 일기 상세 칩. 기록한 사람이 맨 앞.
 * 1명이면 `{호칭}와/과 산책`, 2명 이상이면 `{맨 앞} 외 {n}명과 산책`.
 * 지금 집에 나 혼자면 표시하지 않는다.
 */
export function formatWalkCompanyChip(
  people: WalkPerson[],
  householdMemberCount: number,
): string | null {
  if (householdMemberCount <= 1) return null;

  const labels = [...people]
    .sort((a, b) => Number(b.isRecorder) - Number(a.isRecorder))
    .map(walkPersonLabel);
  const [first] = labels;
  if (!first) return null;
  if (labels.length === 1) {
    return `👪 ${first}${josa(first, '과', '와')} 산책`;
  }
  return `👪 ${first} 외 ${labels.length - 1}명과 산책`;
}
