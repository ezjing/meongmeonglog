import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';

import { useElapsedSec } from '@/hooks/useElapsedSec';
import { fetchCurrentWeather } from '@/lib/api/weatherApi';
import { updateWalkWeather } from '@/lib/api/walkApi';
import { flushAllPendingDbLocations } from '@/lib/walk/walkLocationProcessor';
import {
  loadPersistedWalkState,
  savePersistedWalkState,
} from '@/lib/walk/walkSessionStorage';
import {
  requestWalkLocationPermissions,
  startWalkTracking,
} from '@/lib/walk/walkLocationService';
import { useWalkStore } from '@/stores/walkStore';

const SYNC_INTERVAL_MS = 2_000;

export async function getCurrentCoordinates(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

async function applyWeatherForCoords(
  walkId: string,
  latitude: number,
  longitude: number,
): Promise<void> {
  const weather = await fetchCurrentWeather(latitude, longitude);
  const payload = {
    weatherCondition: weather.condition,
    weatherTemp: weather.temp,
    weatherIcon: weather.icon,
  };

  useWalkStore.getState().updateActiveWalkWeather(payload);

  const persisted = await loadPersistedWalkState();
  if (persisted?.activeWalk.walkId === walkId) {
    await savePersistedWalkState({
      ...persisted,
      activeWalk: {
        ...persisted.activeWalk,
        weatherCondition: payload.weatherCondition,
        weatherTemp: payload.weatherTemp,
        weatherIcon: payload.weatherIcon,
      },
    });
  }

  await updateWalkWeather(walkId, payload).catch(() => {});
}

async function syncWalkStateFromStorage(): Promise<void> {
  const persisted = await loadPersistedWalkState();
  if (!persisted?.activeWalk) return;
  useWalkStore.getState().hydrateFromPersisted(persisted);
  await flushAllPendingDbLocations();
}

export function useWalkTracker() {
  const activeWalk = useWalkStore((s) => s.activeWalk);
  const distanceMeter = useWalkStore((s) => s.distanceMeter);
  const frozenElapsedSec = useWalkStore((s) => s.frozenElapsedSec);
  const liveElapsedSec = useElapsedSec(
    frozenElapsedSec != null ? null : activeWalk?.startedAt,
  );
  const elapsedSec = frozenElapsedSec ?? liveElapsedSec;
  const weatherFetchedRef = useRef(false);

  useEffect(() => {
    weatherFetchedRef.current = false;
  }, [activeWalk?.walkId]);

  useEffect(() => {
    if (!activeWalk || frozenElapsedSec != null) return;

    let cancelled = false;

    (async () => {
      await syncWalkStateFromStorage();

      const granted = await requestWalkLocationPermissions();
      if (!granted || cancelled) return;

      await startWalkTracking(activeWalk);

      if (activeWalk.weatherTemp == null) {
        try {
          const coords = await getCurrentCoordinates();
          if (coords && !cancelled && !weatherFetchedRef.current) {
            weatherFetchedRef.current = true;
            await applyWeatherForCoords(
              activeWalk.walkId,
              coords.latitude,
              coords.longitude,
            );
            await syncWalkStateFromStorage();
          }
        } catch {
          weatherFetchedRef.current = false;
        }
      }
    })();

    const syncInterval = setInterval(() => {
      syncWalkStateFromStorage().catch(() => {});
    }, SYNC_INTERVAL_MS);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        syncWalkStateFromStorage().catch(() => {});
      }
    });

    return () => {
      cancelled = true;
      clearInterval(syncInterval);
      subscription.remove();
    };
  }, [activeWalk?.walkId, frozenElapsedSec]);

  return {
    activeWalk,
    elapsedSec,
    distanceMeter,
  };
}

export async function requestLocationPermission(): Promise<boolean> {
  return requestWalkLocationPermissions();
}

export { startWalkTracking, stopWalkTracking, pauseWalkLocationUpdates } from '@/lib/walk/walkLocationService';
export { freezeWalkSession } from '@/lib/walk/freezeWalkSession';
