import { create } from 'zustand';

import type { PersistedWalkState } from '@/lib/walk/walkSessionStorage';
import type { DogGender, DogMeetingLevel } from '@/types/database';
import type { WalkPhoto, WalkSession } from '@/types/domain';

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

interface OnboardingStore {
  name: string;
  breed: string;
  birthDate: string;
  gender: DogGender;
  weightKg: string;
  personality: string[];
  speechStyle: string;
  customPersonality: string;
  customSpeechStyle: string;
  profileImageUri: string | null;
  /** 수정 모드에서 서버 값을 채운 강아지 id. 한 번 채운 뒤 refetch돼도 입력 중인 값을 덮어쓰지 않기 위함 */
  syncedDogId: string | null;
  setSyncedDogId: (dogId: string) => void;
  setBasic: (
    data: Partial<
      Pick<
        OnboardingStore,
        'name' | 'breed' | 'birthDate' | 'gender' | 'weightKg' | 'profileImageUri'
      >
    >,
  ) => void;
  setPersonality: (
    data: Partial<
      Pick<
        OnboardingStore,
        'personality' | 'speechStyle' | 'customPersonality' | 'customSpeechStyle'
      >
    >,
  ) => void;
  reset: () => void;
}

const defaultOnboarding = {
  name: '',
  breed: '포메라니안',
  birthDate: '2023-05-12',
  gender: 'MALE' as DogGender,
  weightKg: '',
  personality: [] as string[],
  speechStyle: '기본',
  customPersonality: '',
  customSpeechStyle: '',
  profileImageUri: null as string | null,
  syncedDogId: null as string | null,
};

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  ...defaultOnboarding,
  setSyncedDogId: (dogId) => set({ syncedDogId: dogId }),
  setBasic: (data) => set(data),
  setPersonality: (data) => set(data),
  reset: () => set(defaultOnboarding),
}));

interface AuthStore {
  userId: string | null;
  provider: 'kakao' | 'naver' | null;
  setSession: (userId: string, provider: 'kakao' | 'naver') => void;
  clearSession: () => void;
  /** 다른 기기 로그인 등으로 세션이 끊겨 로그아웃된 경우 로그인 화면에서 안내한다 */
  sessionEndedElsewhere: boolean;
  setSessionEndedElsewhere: (value: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  userId: null,
  provider: null,
  setSession: (userId, provider) => set({ userId, provider }),
  clearSession: () => set({ userId: null, provider: null }),
  sessionEndedElsewhere: false,
  setSessionEndedElsewhere: (value) => set({ sessionEndedElsewhere: value }),
}));

interface FinishWalkForm {
  photoUris: string[];
  peeSelected: boolean;
  poopSelected: boolean;
  dogMeetingLevel: DogMeetingLevel;
  memo: string;
}

interface FinishWalkStore {
  form: FinishWalkForm;
  setPhotoUris: (uris: string[]) => void;
  togglePee: () => void;
  togglePoop: () => void;
  setDogMeetingLevel: (level: DogMeetingLevel) => void;
  setMemo: (memo: string) => void;
  reset: () => void;
}

const defaultFinishForm: FinishWalkForm = {
  photoUris: [],
  peeSelected: false,
  poopSelected: false,
  dogMeetingLevel: 'NONE',
  memo: '',
};

export const useFinishWalkStore = create<FinishWalkStore>((set, get) => ({
  form: defaultFinishForm,
  setPhotoUris: (uris) => set({ form: { ...get().form, photoUris: uris } }),
  togglePee: () => set({ form: { ...get().form, peeSelected: !get().form.peeSelected } }),
  togglePoop: () => set({ form: { ...get().form, poopSelected: !get().form.poopSelected } }),
  setDogMeetingLevel: (level) => set({ form: { ...get().form, dogMeetingLevel: level } }),
  setMemo: (memo) => set({ form: { ...get().form, memo } }),
  reset: () => set({ form: defaultFinishForm }),
}));
