import * as Location from 'expo-location';
import { PermissionsAndroid, Platform } from 'react-native';

import { BACKGROUND_WALK_TASK, isBackgroundWalkTaskRunning } from '@/lib/walk/backgroundWalkTask';
import {
  clearPersistedWalkState,
  createInitialWalkState,
  loadPersistedWalkState,
  savePersistedWalkState,
} from '@/lib/walk/walkSessionStorage';
import type { WalkSession } from '@/types/domain';

const LOCATION_INTERVAL_MS = 15_000;

async function requestAndroidNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android' || Platform.Version < 33) return true;

  const current = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  if (current) return true;

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export async function requestWalkLocationPermissions(): Promise<boolean> {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== 'granted') return false;

  if (Platform.OS === 'android') {
    return requestAndroidNotificationPermission();
  }

  if (Platform.OS === 'ios') {
    const background = await Location.requestBackgroundPermissionsAsync();
    return background.status === 'granted';
  }

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

  const commonOptions = {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: LOCATION_INTERVAL_MS,
    distanceInterval: 10,
    pausesUpdatesAutomatically: false,
  };

  try {
    if (Platform.OS === 'android') {
      await Location.startLocationUpdatesAsync(BACKGROUND_WALK_TASK, {
        ...commonOptions,
        foregroundService: {
          notificationTitle: '멍멍로그',
          notificationBody: '산책 경로를 기록하고 있어요',
          notificationColor: '#FF8A5B',
        },
      });
      return;
    }

    await Location.startLocationUpdatesAsync(BACKGROUND_WALK_TASK, {
      ...commonOptions,
      showsBackgroundLocationIndicator: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '위치 추적을 시작하지 못했어요';
    throw new Error(message);
  }
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
