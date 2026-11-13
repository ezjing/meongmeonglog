import type { LocationObject } from 'expo-location';

import { saveWalkLocation } from '@/entities/walk';
import {
  loadPersistedWalkState,
  updatePersistedWalkState,
  type PendingWalkLocation,
  type WalkCoord,
} from '@/entities/walk';
import { haversineDistance } from '@/shared/lib/formatDistance';

/** 오차 반경이 이보다 크면 Wi-Fi·기지국 추정 위치로 보고 버린다 */
const MAX_ACCURACY_M = 30;
/** 직전 좌표 대비 이보다 빠르면 튄 좌표로 보고 버린다 (25km/h) */
const MAX_SPEED_MPS = 25_000 / 3600;
/** 이보다 작은 이동은 제자리 흔들림으로 보고 거리에 더하지 않는다 */
const MIN_DISTANCE_DELTA_M = 2;

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

async function flushPendingDbLocations(
  walkId: string,
  pendingDbLocations: PendingWalkLocation[],
): Promise<PendingWalkLocation[]> {
  for (let i = 0; i < pendingDbLocations.length; i++) {
    const loc = pendingDbLocations[i];
    try {
      await saveWalkLocation(walkId, loc.latitude, loc.longitude, loc.recordedAt);
    } catch {
      return pendingDbLocations.slice(i);
    }
  }
  return [];
}

export async function processWalkLocations(locations: LocationObject[]): Promise<void> {
  if (locations.length === 0) return;

  const state = await loadPersistedWalkState();
  if (!state?.activeWalk) return;

  const walkStartedAtMs = new Date(state.activeWalk.startedAt).getTime();

  const updated = await updatePersistedWalkState(state.activeWalk.walkId, (current) => {
    let { distanceMeter, walkPath, pendingDbLocations } = current;
    let last: AcceptedPoint | null =
      current.lastLatitude != null && current.lastLongitude != null
        ? {
            latitude: current.lastLatitude,
            longitude: current.lastLongitude,
            timestamp: current.lastTimestamp ?? null,
          }
        : null;

    for (const location of locations) {
      if (!isAcceptableLocation(location, walkStartedAtMs, last)) continue;

      const { latitude, longitude } = location.coords;
      const coord: WalkCoord = { latitude, longitude };

      walkPath = [...walkPath, coord];
      pendingDbLocations = [...pendingDbLocations, { ...coord, recordedAt: location.timestamp }];

      if (last) {
        const delta = haversineDistance(last.latitude, last.longitude, latitude, longitude);
        if (delta > MIN_DISTANCE_DELTA_M) distanceMeter += delta;
      }

      last = { latitude, longitude, timestamp: location.timestamp };
    }

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

  if (updated) await flushAllPendingDbLocations();
}

let flushChain: Promise<unknown> = Promise.resolve();

async function flushPersistedPendingLocations(): Promise<void> {
  const snapshot = await loadPersistedWalkState();
  if (!snapshot?.activeWalk || snapshot.pendingDbLocations.length === 0) return;

  const { walkId } = snapshot.activeWalk;
  const pending = snapshot.pendingDbLocations;
  const remaining = await flushPendingDbLocations(walkId, pending);
  const flushedCount = pending.length - remaining.length;
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
