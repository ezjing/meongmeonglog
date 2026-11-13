import {
  loadPersistedWalkState,
  updatePersistedWalkState,
  useWalkStore,
  pauseWalkLocationUpdates,
} from '@/entities/walk';

import { getElapsedSecFromStartedAt } from '../model/useElapsedSec';

export async function freezeWalkSession(): Promise<number> {
  const persisted = await loadPersistedWalkState();
  const activeWalk = persisted?.activeWalk ?? useWalkStore.getState().activeWalk;
  if (!activeWalk) return 0;

  const elapsedSec = getElapsedSecFromStartedAt(activeWalk.startedAt);

  await pauseWalkLocationUpdates();

  if (persisted) {
    await updatePersistedWalkState(persisted.activeWalk.walkId, (current) => ({
      ...current,
      frozenElapsedSec: elapsedSec,
    }));
  }

  useWalkStore.getState().freezeWalkElapsed(elapsedSec);

  return elapsedSec;
}
