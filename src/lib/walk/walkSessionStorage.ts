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
