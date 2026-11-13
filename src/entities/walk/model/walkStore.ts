import { create } from 'zustand';

import type { WalkPhoto, WalkSession } from './types';
import type { PersistedWalkState } from './walkSessionStorage';

interface WalkStore {
  activeWalk: WalkSession | null;
  distanceMeter: number;
  frozenElapsedSec: number | null;
  walkPath: { latitude: number; longitude: number }[];
  pendingWalkPhotosByWalkId: Record<string, WalkPhoto[]>;
  setActiveWalk: (walk: WalkSession | null) => void;
  hydrateFromPersisted: (state: PersistedWalkState) => void;
  freezeWalkElapsed: (elapsedSec: number) => void;
  updateActiveWalkWeather: (weather: {
    weatherCondition: string;
    weatherTemp: number;
    weatherIcon: string;
  }) => void;
  setPendingWalkPhotos: (walkId: string, photos: WalkPhoto[]) => void;
  clearPendingWalkPhotos: (walkId: string) => void;
  reset: () => void;
}

export const useWalkStore = create<WalkStore>((set, get) => ({
  activeWalk: null,
  distanceMeter: 0,
  frozenElapsedSec: null,
  walkPath: [],
  pendingWalkPhotosByWalkId: {},
  setActiveWalk: (walk) => set({ activeWalk: walk }),
  hydrateFromPersisted: (state) =>
    set({
      activeWalk: state.activeWalk,
      distanceMeter: state.distanceMeter,
      walkPath: state.walkPath,
      frozenElapsedSec: state.frozenElapsedSec ?? null,
    }),
  freezeWalkElapsed: (elapsedSec) => set({ frozenElapsedSec: elapsedSec }),
  updateActiveWalkWeather: (weather) => {
    const walk = get().activeWalk;
    if (!walk) return;
    set({
      activeWalk: {
        ...walk,
        weatherCondition: weather.weatherCondition,
        weatherTemp: weather.weatherTemp,
        weatherIcon: weather.weatherIcon,
      },
    });
  },
  setPendingWalkPhotos: (walkId, photos) =>
    set((state) => ({
      pendingWalkPhotosByWalkId: {
        ...state.pendingWalkPhotosByWalkId,
        [walkId]: photos,
      },
    })),
  clearPendingWalkPhotos: (walkId) =>
    set((state) => {
      const next = { ...state.pendingWalkPhotosByWalkId };
      delete next[walkId];
      return { pendingWalkPhotosByWalkId: next };
    }),
  reset: () =>
    set({
      activeWalk: null,
      distanceMeter: 0,
      frozenElapsedSec: null,
      walkPath: [],
    }),
}));
