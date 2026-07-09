import type { LocationObject } from 'expo-location';

import { saveWalkLocation } from '@/lib/api/walkApi';
import { haversineDistance } from '@/lib/utils/formatDistance';
import {
  loadPersistedWalkState,
  savePersistedWalkState,
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

  let { distanceMeter, walkPath, lastLatitude, lastLongitude, pendingDbLocations, activeWalk } =
    state;

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

  pendingDbLocations = await flushPendingDbLocations(activeWalk.walkId, pendingDbLocations);

  await savePersistedWalkState({
    ...state,
    activeWalk,
    distanceMeter,
    walkPath,
    lastLatitude,
    lastLongitude,
    pendingDbLocations,
  });
}

export async function flushAllPendingDbLocations(): Promise<void> {
  const state = await loadPersistedWalkState();
  if (!state?.activeWalk) return;

  const pendingDbLocations = await flushPendingDbLocations(
    state.activeWalk.walkId,
    state.pendingDbLocations,
  );

  await savePersistedWalkState({
    ...state,
    pendingDbLocations,
  });
}
