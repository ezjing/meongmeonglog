import * as Location from 'expo-location';

import { clearPersistedWalkState, withWalkStateLock } from '../model/walkSessionStorage';

/** 백그라운드 위치 태스크 이름. 태스크 정의(features/walk-session)와 중지(로그아웃 등)가 함께 쓴다 */
export const BACKGROUND_WALK_TASK = 'meongmeonglog-background-walk';

export async function isBackgroundWalkTaskRunning(): Promise<boolean> {
  return Location.hasStartedLocationUpdatesAsync(BACKGROUND_WALK_TASK);
}

export async function pauseWalkLocationUpdates(): Promise<void> {
  const running = await isBackgroundWalkTaskRunning();
  if (running) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_WALK_TASK);
  }
}

/** 위치 추적을 멈추고 저장된 산책 상태를 지운다 (산책 취소·종료, 로그아웃 시) */
export async function stopWalkTracking(): Promise<void> {
  await pauseWalkLocationUpdates();
  await withWalkStateLock(clearPersistedWalkState);
}
