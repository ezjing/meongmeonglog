import { isWebWalkWatchRunning, pauseWebWalkWatch } from './webWalkWatch';
import { clearPersistedWalkState, withWalkStateLock } from '../model/walkSessionStorage';

/** 네이티브 태스크 이름과 맞춘다. 웹에는 백그라운드 태스크가 없다. */
export const BACKGROUND_WALK_TASK = 'meongmeonglog-background-walk';

export async function isBackgroundWalkTaskRunning(): Promise<boolean> {
  return isWebWalkWatchRunning();
}

export async function pauseWalkLocationUpdates(): Promise<void> {
  await pauseWebWalkWatch();
}

/** 위치 추적을 멈추고 저장된 산책 상태를 지운다 (산책 취소·종료, 로그아웃 시) */
export async function stopWalkTracking(): Promise<void> {
  await pauseWalkLocationUpdates();
  await withWalkStateLock(clearPersistedWalkState);
}
