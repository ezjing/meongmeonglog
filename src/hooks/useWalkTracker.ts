import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';

import { saveWalkLocation } from '@/lib/api/walkApi';
import { haversineDistance } from '@/lib/utils/formatDistance';
import { useWalkStore } from '@/stores/walkStore';

const LOCATION_INTERVAL_MS = 15_000;

export function useWalkTracker() {
  const {
    activeWalk,
    elapsedSec,
    distanceMeter,
    tickElapsed,
    addDistance,
    addLocation,
    flushLocationBuffer,
  } = useWalkStore();

  const lastCoords = useRef<{ latitude: number; longitude: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (!activeWalk) return;

    timerRef.current = setInterval(tickElapsed, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeWalk, tickElapsed]);

  useEffect(() => {
    if (!activeWalk) return;

    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;

      locationRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: LOCATION_INTERVAL_MS,
          distanceInterval: 10,
        },
        (loc) => {
          const { latitude, longitude } = loc.coords;
          addLocation(latitude, longitude);

          if (lastCoords.current) {
            const delta = haversineDistance(
              lastCoords.current.latitude,
              lastCoords.current.longitude,
              latitude,
              longitude,
            );
            if (delta > 2 && delta < 100) {
              addDistance(delta);
            }
          }
          lastCoords.current = { latitude, longitude };
        },
      );
    })();

    return () => {
      cancelled = true;
      locationRef.current?.remove();
    };
  }, [activeWalk, addLocation, addDistance]);

  useEffect(() => {
    if (!activeWalk) return;

    const syncInterval = setInterval(async () => {
      const buffer = flushLocationBuffer();
      for (const loc of buffer) {
        await saveWalkLocation(activeWalk.walkId, loc.latitude, loc.longitude).catch(() => {});
      }
    }, LOCATION_INTERVAL_MS);

    return () => clearInterval(syncInterval);
  }, [activeWalk, flushLocationBuffer]);

  return {
    activeWalk,
    elapsedSec,
    distanceMeter,
  };
}

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}
