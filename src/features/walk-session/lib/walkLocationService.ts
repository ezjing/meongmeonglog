import * as Location from 'expo-location';
import { Platform } from 'react-native';

import {
  BACKGROUND_WALK_TASK,
  createInitialWalkState,
  isBackgroundWalkTaskRunning,
  loadPersistedWalkState,
  savePersistedWalkState,
  withWalkStateLock,
} from '@/entities/walk';
import type { WalkSession } from '@/entities/walk';
import { colors } from '@/shared/config/theme';

const LOCATION_INTERVAL_MS = 5_000;
const LOCATION_DISTANCE_INTERVAL_M = 5;

export async function startWalkTracking(activeWalk: WalkSession): Promise<void> {
  await withWalkStateLock(async () => {
    const existing = await loadPersistedWalkState();
    if (existing?.activeWalk.walkId === activeWalk.walkId) {
      await savePersistedWalkState({ ...existing, activeWalk });
    } else {
      await savePersistedWalkState(createInitialWalkState(activeWalk));
    }
  });

  const alreadyRunning = await isBackgroundWalkTaskRunning();
  if (alreadyRunning) return;

  const commonOptions = {
    accuracy: Location.Accuracy.Highest,
    timeInterval: LOCATION_INTERVAL_MS,
    distanceInterval: LOCATION_DISTANCE_INTERVAL_M,
    pausesUpdatesAutomatically: false,
  };

  try {
    if (Platform.OS === 'android') {
      await Location.startLocationUpdatesAsync(BACKGROUND_WALK_TASK, {
        ...commonOptions,
        foregroundService: {
          notificationTitle: '멍멍로그',
          notificationBody: '산책 경로를 기록하고 있어요',
          notificationColor: colors.primary,
        },
      });
      return;
    }

    await Location.startLocationUpdatesAsync(BACKGROUND_WALK_TASK, {
      ...commonOptions,
      activityType: Location.LocationActivityType.Fitness,
      showsBackgroundLocationIndicator: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '위치 추적을 시작하지 못했어요';
    throw new Error(message);
  }
}
