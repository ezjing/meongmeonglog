import type { LocationObject } from 'expo-location';

import {
  loadPersistedWalkState,
  saveWalkLocations,
  updateActiveWalkState,
  updatePersistedWalkState,
  type WalkCoord,
} from '@/entities/walk';
import { haversineDistance } from '@/shared/lib/geo';

/** 오차 반경이 이보다 크면 Wi-Fi·기지국 추정 위치로 보고 버린다 */
export const MAX_ACCURACY_M = 30;
/** 직전 좌표 대비 이보다 빠르면 튄 좌표로 보고 버린다 (25km/h) */
const MAX_SPEED_MPS = 25_000 / 3600;
/** 이보다 작은 이동은 제자리 흔들림으로 보고 거리에 더하지 않는다 */
const MIN_DISTANCE_DELTA_M = 2;
/**
 * 좌표를 받을 때마다 보내면 통신 모듈이 쉬지 못해 배터리를 많이 쓴다.
 * 이만큼 모이거나 가장 오래된 좌표가 이 시간을 넘으면 한 번에 보낸다.
 * (앱으로 돌아올 때·산책 종료 때는 따로 바로 보낸다. 대기 좌표는 기기에 저장돼 있어 잃지 않는다)
 */
const FLUSH_BATCH_SIZE = 12;
const FLUSH_MAX_AGE_MS = 60_000;

interface AcceptedPoint {
  latitude: number;
  longitude: number;
  timestamp: number | null;
}

function isAcceptableLocation(
  location: LocationObject,
  walkStartedAtMs: number,
  last: AcceptedPoint | null,
): boolean {
  const { latitude, longitude, accuracy } = location.coords;

  // 산책 시작 전에 측정된 캐시 위치
  if (location.timestamp < walkStartedAtMs) return false;

  if (accuracy == null || accuracy > MAX_ACCURACY_M) return false;

  if (!last) return true;

  // 이전 버전에서 시각 없이 저장된 좌표 뒤에는 속도 검사를 건너뛴다
  if (last.timestamp == null) return true;

  const elapsedSec = (location.timestamp - last.timestamp) / 1000;
  if (elapsedSec <= 0) return false;

  const delta = haversineDistance(last.latitude, last.longitude, latitude, longitude);
  return delta / elapsedSec <= MAX_SPEED_MPS;
}

export async function processWalkLocations(locations: LocationObject[]): Promise<void> {
  const updated = await updateActiveWalkState((current) => {
    const walkStartedAtMs = new Date(current.activeWalk.startedAt).getTime();
    // 배치 안에서는 같은 배열에 push한다 (좌표마다 경로 전체를 복사하지 않도록)
    const walkPath = [...current.walkPath];
    const pendingDbLocations = [...current.pendingDbLocations];
    let { distanceMeter } = current;
    let last: AcceptedPoint | null =
      current.lastLatitude != null && current.lastLongitude != null
        ? {
            latitude: current.lastLatitude,
            longitude: current.lastLongitude,
            timestamp: current.lastTimestamp ?? null,
          }
        : null;

    let accepted = 0;
    for (const location of locations) {
      if (!isAcceptableLocation(location, walkStartedAtMs, last)) continue;
      accepted += 1;

      const { latitude, longitude } = location.coords;
      // 기준점이 없는데 경로가 이미 있으면 기록이 끊겼던 뒤다 → 앞 구간과 잇지 않는다
      const coord: WalkCoord =
        last == null && walkPath.length > 0
          ? { latitude, longitude, segmentStart: true }
          : { latitude, longitude };

      walkPath.push(coord);
      pendingDbLocations.push({ latitude, longitude, recordedAt: location.timestamp });

      if (last) {
        const delta = haversineDistance(last.latitude, last.longitude, latitude, longitude);
        if (delta > MIN_DISTANCE_DELTA_M) distanceMeter += delta;
      }

      last = { latitude, longitude, timestamp: location.timestamp };
    }

    // 채택한 좌표가 없으면 저장하지 않는다
    if (accepted === 0) return current;

    return {
      ...current,
      distanceMeter,
      walkPath,
      lastLatitude: last?.latitude ?? null,
      lastLongitude: last?.longitude ?? null,
      lastTimestamp: last?.timestamp ?? null,
      pendingDbLocations,
    };
  });

  if (!updated) return;
  const pending = updated.pendingDbLocations;
  if (pending.length === 0) return;
  const oldest = pending[0].recordedAt;
  const isOld = oldest == null || Date.now() - oldest >= FLUSH_MAX_AGE_MS;
  if (pending.length >= FLUSH_BATCH_SIZE || isOld) await flushAllPendingDbLocations();
}

let flushChain: Promise<unknown> = Promise.resolve();

async function flushPersistedPendingLocations(): Promise<void> {
  const snapshot = await loadPersistedWalkState();
  if (!snapshot?.activeWalk || snapshot.pendingDbLocations.length === 0) return;

  const { walkId } = snapshot.activeWalk;
  const flushedCount = await saveWalkLocations(walkId, snapshot.pendingDbLocations);
  if (flushedCount === 0) return;

  // 전송 중 새로 쌓인 좌표는 유지하고, 전송한 앞부분만 제거
  await updatePersistedWalkState(walkId, (current) => ({
    ...current,
    pendingDbLocations: current.pendingDbLocations.slice(flushedCount),
  }));
}

/** 미전송 좌표 전송을 한 번에 하나씩 실행해 같은 좌표가 중복 저장되지 않게 한다 */
export function flushAllPendingDbLocations(): Promise<void> {
  const run = flushChain.then(flushPersistedPendingLocations);
  flushChain = run.catch(() => {});
  return run;
}
