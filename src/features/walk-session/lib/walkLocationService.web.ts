import type { LocationObject } from 'expo-location';

import {
  bindWebWalkWatch,
  createInitialWalkState,
  loadPersistedWalkState,
  savePersistedWalkState,
  updateActiveWalkState,
  withWalkStateLock,
  type WalkSession,
} from '@/entities/walk';
import { haversineDistance } from '@/shared/lib/formatDistance';

import { processWalkLocations } from './walkLocationProcessor';
import { acquireWebWalkWakeLock, releaseWebWalkWakeLock } from './webWakeLock';
import { subscribeWebWalkGeolocation, type WebGeoFix } from './webWalkGeolocation';

/** 네이티브 위치 간격과 같다 */
const LOCATION_INTERVAL_MS = 5_000;
const LOCATION_DISTANCE_INTERVAL_M = 5;

let wantsTracking = false;
let unsubscribe: (() => void) | null = null;
let breakPathOnNextPoint = false;
let lastEmittedAt = 0;
let lastEmittedLatitude: number | null = null;
let lastEmittedLongitude: number | null = null;
let queue: Promise<void> = Promise.resolve();

function enqueue(task: () => Promise<void>): Promise<void> {
  const run = queue.then(task);
  queue = run.catch(() => {});
  return run;
}

function isPageHidden() {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden';
}

function toLocation(fix: WebGeoFix): LocationObject {
  return {
    coords: {
      latitude: fix.latitude,
      longitude: fix.longitude,
      altitude: null,
      accuracy: fix.accuracy,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: fix.timestamp,
  };
}

function shouldEmit(location: LocationObject) {
  if (lastEmittedAt === 0 || lastEmittedLatitude == null || lastEmittedLongitude == null)
    return true;

  const elapsed = location.timestamp - lastEmittedAt;
  if (elapsed >= LOCATION_INTERVAL_MS) return true;

  const moved = haversineDistance(
    lastEmittedLatitude,
    lastEmittedLongitude,
    location.coords.latitude,
    location.coords.longitude,
  );
  return moved >= LOCATION_DISTANCE_INTERVAL_M;
}

function rememberEmitted(location: LocationObject) {
  lastEmittedAt = location.timestamp;
  lastEmittedLatitude = location.coords.latitude;
  lastEmittedLongitude = location.coords.longitude;
}

async function handleLocation(location: LocationObject) {
  if (!wantsTracking || isPageHidden()) return;
  if (!shouldEmit(location)) return;
  rememberEmitted(location);

  if (breakPathOnNextPoint) {
    breakPathOnNextPoint = false;
    // 화면이 꺼졌던(또는 페이지가 다시 로드된) 구간은 잇지 않는다: 기준점을 비우면
    // 다음으로 채택된 좌표가 거리 없이 새 구간의 시작이 된다 (정확도 검사는 그대로 거친다)
    await updateActiveWalkState((current) => ({
      ...current,
      lastLatitude: null,
      lastLongitude: null,
      lastTimestamp: null,
    }));
  }

  await processWalkLocations([location]);
}

function stopWatch() {
  unsubscribe?.();
  unsubscribe = null;
}

function startWatch() {
  if (unsubscribe || isPageHidden()) return;
  if (typeof navigator !== 'undefined' && !('geolocation' in navigator)) {
    throw new Error('위치 추적을 시작하지 못했어요.');
  }

  unsubscribe = subscribeWebWalkGeolocation((fix) => {
    void enqueue(() => handleLocation(toLocation(fix)));
  });
}

function onVisibilityChange() {
  void enqueue(async () => {
    if (!wantsTracking) return;
    if (isPageHidden()) {
      breakPathOnNextPoint = true;
      stopWatch();
      return;
    }
    acquireWebWalkWakeLock();
    startWatch();
  });
}

async function pauseWebWalk() {
  await enqueue(async () => {
    wantsTracking = false;
    breakPathOnNextPoint = false;
    lastEmittedAt = 0;
    lastEmittedLatitude = null;
    lastEmittedLongitude = null;
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    }
    stopWatch();
    releaseWebWalkWakeLock();
  });
}

bindWebWalkWatch({
  isRunning: () => wantsTracking && unsubscribe != null,
  pause: pauseWebWalk,
});

export async function startWalkTracking(activeWalk: WalkSession): Promise<void> {
  // 새로고침·탭 재로드로 이 모듈이 처음부터 다시 실행됐는데 저장된 산책이 이어지는 경우
  let resumedAfterReload = false;
  await withWalkStateLock(async () => {
    const existing = await loadPersistedWalkState();
    if (existing?.activeWalk.walkId === activeWalk.walkId) {
      resumedAfterReload = existing.lastTimestamp != null;
      await savePersistedWalkState({ ...existing, activeWalk });
    } else {
      await savePersistedWalkState(createInitialWalkState(activeWalk));
    }
  });

  await enqueue(async () => {
    const sameSession = wantsTracking;
    wantsTracking = true;
    if (!sameSession) {
      // 페이지가 다시 로드된 동안은 기록되지 않았으므로, 화면이 꺼졌던 경우와 같이 다음 위치를 새 기준으로 둔다
      breakPathOnNextPoint = resumedAfterReload;
      lastEmittedAt = 0;
      lastEmittedLatitude = null;
      lastEmittedLongitude = null;
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }
    acquireWebWalkWakeLock();
    startWatch();
  });
}
