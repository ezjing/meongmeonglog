import type { LocationObject } from 'expo-location';

import { saveWalkLocation } from '@/lib/api/walkApi';
import { haversineDistance } from '@/lib/utils/formatDistance';
import {
  loadPersistedWalkState,
  updatePersistedWalkState,
  type WalkCoord,
} from '@/lib/walk/walkSessionStorage';

function applyLocationDelta(
  lastLatitude: number | null,
  lastLongitude: number | null,
  latitude: number,
  longitude: number,
  distanceMeter: number,
): { distanceMeter: number; lastLatitude: number; lastLongitude: number } {
  if (lastLatitude == null || lastLongitude == null) {
    return { distanceMeter, lastLatitude: latitude, lastLongitude: longitude };
  }

  const delta = haversineDistance(lastLatitude, lastLongitude, latitude, longitude);
  if (delta > 2 && delta < 100) {
    return {
      distanceMeter: distanceMeter + delta,
      lastLatitude: latitude,
      lastLongitude: longitude,
    };
  }

  return { distanceMeter, lastLatitude: latitude, lastLongitude: longitude };
}

async function flushPendingDbLocations(
  walkId: string,
  pendingDbLocations: WalkCoord[],
): Promise<WalkCoord[]> {
  for (let i = 0; i < pendingDbLocations.length; i++) {
    const loc = pendingDbLocations[i];
    try {
      await saveWalkLocation(walkId, loc.latitude, loc.longitude);
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

  const updated = await updatePersistedWalkState(state.activeWalk.walkId, (current) => {
    let { distanceMeter, walkPath, lastLatitude, lastLongitude, pendingDbLocations } = current;

    for (const location of locations) {
      const { latitude, longitude } = location.coords;
      const coord: WalkCoord = { latitude, longitude };

      walkPath = [...walkPath, coord];
      pendingDbLocations = [...pendingDbLocations, coord];

      const next = applyLocationDelta(
        lastLatitude,
        lastLongitude,
        latitude,
        longitude,
        distanceMeter,
      );
      distanceMeter = next.distanceMeter;
      lastLatitude = next.lastLatitude;
      lastLongitude = next.lastLongitude;
    }

    return {
      ...current,
      distanceMeter,
      walkPath,
      lastLatitude,
      lastLongitude,
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
