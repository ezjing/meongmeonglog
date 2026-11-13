import { pauseWalkLocationUpdates, updateActiveWalkState, useWalkStore } from '@/entities/walk';

import { getElapsedSecFromStartedAt } from '../model/useElapsedSec';

export async function freezeWalkSession(): Promise<number> {
  await pauseWalkLocationUpdates();

  let elapsedSec: number | null = null;
  await updateActiveWalkState((current) => {
    elapsedSec = getElapsedSecFromStartedAt(current.activeWalk.startedAt);
    return { ...current, frozenElapsedSec: elapsedSec };
  });

  // 저장된 산책이 없으면 메모리의 산책 기준으로 계산
  if (elapsedSec == null) {
    const activeWalk = useWalkStore.getState().activeWalk;
    if (!activeWalk) return 0;
    elapsedSec = getElapsedSecFromStartedAt(activeWalk.startedAt);
  }

  useWalkStore.getState().freezeWalkElapsed(elapsedSec);
  return elapsedSec;
}
