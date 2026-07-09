import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { useElapsedSec } from '@/hooks/useElapsedSec';
import { updateWalkWeather } from '@/lib/api/walkApi';
import { fetchCurrentWeather } from '@/lib/api/weatherApi';
import { flushAllPendingDbLocations } from '@/lib/walk/walkLocationProcessor';
import { requestWalkLocationPermissions, startWalkTracking } from '@/lib/walk/walkLocationService';
import { loadPersistedWalkState, savePersistedWalkState } from '@/lib/walk/walkSessionStorage';
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
  const liveElapsedSec = useElapsedSec(frozenElapsedSec != null ? null : activeWalk?.startedAt);
  const elapsedSec = frozenElapsedSec ?? liveElapsedSec;
  const weatherFetchedRef = useRef(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  useEffect(() => {
    weatherFetchedRef.current = false;
    setTrackingError(null);
  }, [activeWalk?.walkId]);

  useEffect(() => {
    if (!activeWalk || frozenElapsedSec != null) return;

    let cancelled = false;

    (async () => {
      await syncWalkStateFromStorage();

      const granted = await requestWalkLocationPermissions();
      if (!granted || cancelled) {
        if (!cancelled && !granted) {
          setTrackingError(
            Platform.OS === 'android'
              ? '위치·알림 권한을 허용해야 산책을 기록할 수 있어요.'
              : '위치 "항상 허용" 권한이 필요해요.',
          );
        }
        return;
      }

      try {
        await startWalkTracking(activeWalk);
      } catch (error) {
        if (!cancelled) {
          setTrackingError(
            error instanceof Error ? error.message : '산책 위치 추적을 시작하지 못했어요.',
          );
        }
        return;
      }

      if (activeWalk.weatherTemp == null) {
        try {
          const coords = await getCurrentCoordinates();
          if (coords && !cancelled && !weatherFetchedRef.current) {
            weatherFetchedRef.current = true;
            await applyWeatherForCoords(activeWalk.walkId, coords.latitude, coords.longitude);
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
    trackingError,
  };
}

export async function requestLocationPermission(): Promise<boolean> {
  return requestWalkLocationPermissions();
}

export {
  startWalkTracking,
  stopWalkTracking,
  pauseWalkLocationUpdates,
} from '@/lib/walk/walkLocationService';
export { freezeWalkSession } from '@/lib/walk/freezeWalkSession';
