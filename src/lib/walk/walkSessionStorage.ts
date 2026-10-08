import AsyncStorage from '@react-native-async-storage/async-storage';

import type { WalkSession } from '@/types/domain';

const WALK_SESSION_KEY = 'meongmeonglog.activeWalk';

export interface WalkCoord {
  latitude: number;
  longitude: number;
}

export interface PersistedWalkState {
  activeWalk: WalkSession;
  distanceMeter: number;
  walkPath: WalkCoord[];
  lastLatitude: number | null;
  lastLongitude: number | null;
  pendingDbLocations: WalkCoord[];
  frozenElapsedSec: number | null;
}

let walkStateLock: Promise<unknown> = Promise.resolve();

/**
 * 산책 상태 읽기-수정-쓰기를 한 번에 하나씩 실행한다.
 * 백그라운드 위치 저장과 산책 종료(clear)가 겹쳐 끝난 산책이 다시 저장되는 것을 막는다.
 */
export function withWalkStateLock<T>(task: () => Promise<T>): Promise<T> {
  const run = walkStateLock.then(task);
  walkStateLock = run.catch(() => {});
  return run;
}

/** 저장된 산책이 walkId와 같을 때만 갱신 (종료·교체된 산책은 건드리지 않음) */
export function updatePersistedWalkState(
  walkId: string,
  updater: (state: PersistedWalkState) => PersistedWalkState,
): Promise<boolean> {
  return withWalkStateLock(async () => {
    const state = await loadPersistedWalkState();
    if (state?.activeWalk.walkId !== walkId) return false;
    await savePersistedWalkState(updater(state));
    return true;
  });
}

export async function savePersistedWalkState(state: PersistedWalkState): Promise<void> {
  await AsyncStorage.setItem(WALK_SESSION_KEY, JSON.stringify(state));
}

export async function loadPersistedWalkState(): Promise<PersistedWalkState | null> {
  const raw = await AsyncStorage.getItem(WALK_SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PersistedWalkState;
  } catch {
    return null;
  }
}

export async function clearPersistedWalkState(): Promise<void> {
  await AsyncStorage.removeItem(WALK_SESSION_KEY);
}

export function createInitialWalkState(activeWalk: WalkSession): PersistedWalkState {
  return {
    activeWalk,
    distanceMeter: 0,
    walkPath: [],
    lastLatitude: null,
    lastLongitude: null,
    pendingDbLocations: [],
    frozenElapsedSec: null,
  };
}
