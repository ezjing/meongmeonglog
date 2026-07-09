import { getElapsedSecFromStartedAt } from '@/hooks/useElapsedSec';
import { pauseWalkLocationUpdates } from '@/lib/walk/walkLocationService';
import { loadPersistedWalkState, savePersistedWalkState } from '@/lib/walk/walkSessionStorage';
import { useWalkStore } from '@/stores/walkStore';

export async function freezeWalkSession(): Promise<number> {
  const persisted = await loadPersistedWalkState();
  const activeWalk = persisted?.activeWalk ?? useWalkStore.getState().activeWalk;
  if (!activeWalk) return 0;

  const elapsedSec = getElapsedSecFromStartedAt(activeWalk.startedAt);

  await pauseWalkLocationUpdates();

  if (persisted) {
    await savePersistedWalkState({
      ...persisted,
      frozenElapsedSec: elapsedSec,
    });
  }

  useWalkStore.getState().freezeWalkElapsed(elapsedSec);

  return elapsedSec;
}
