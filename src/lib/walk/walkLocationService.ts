import * as Location from 'expo-location';

import {
  BACKGROUND_WALK_TASK,
  isBackgroundWalkTaskRunning,
} from '@/lib/walk/backgroundWalkTask';
import {
  clearPersistedWalkState,
  createInitialWalkState,
  loadPersistedWalkState,
  savePersistedWalkState,
} from '@/lib/walk/walkSessionStorage';
import type { WalkSession } from '@/types/domain';

const LOCATION_INTERVAL_MS = 15_000;

export async function requestWalkLocationPermissions(): Promise<boolean> {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== 'granted') return false;

  await Location.requestBackgroundPermissionsAsync();
  return true;
}

export async function startWalkTracking(activeWalk: WalkSession): Promise<void> {
  const existing = await loadPersistedWalkState();
  if (existing?.activeWalk.walkId === activeWalk.walkId) {
    await savePersistedWalkState({ ...existing, activeWalk });
  } else {
    await savePersistedWalkState(createInitialWalkState(activeWalk));
  }

  const alreadyRunning = await isBackgroundWalkTaskRunning();
  if (alreadyRunning) return;

  await Location.startLocationUpdatesAsync(BACKGROUND_WALK_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: LOCATION_INTERVAL_MS,
    distanceInterval: 10,
    showsBackgroundLocationIndicator: true,
    pausesUpdatesAutomatically: false,
    foregroundService: {
      notificationTitle: '멍멍로그',
      notificationBody: '산책 경로를 기록하고 있어요',
      notificationColor: '#FF8A5B',
    },
  });
}

export async function pauseWalkLocationUpdates(): Promise<void> {
  const running = await isBackgroundWalkTaskRunning();
  if (running) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_WALK_TASK);
  }
}

export async function stopWalkTracking(): Promise<void> {
  await pauseWalkLocationUpdates();
  await clearPersistedWalkState();
}
