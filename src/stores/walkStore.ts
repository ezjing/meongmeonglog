import { create } from 'zustand';

import type { DogGender, DogMeetingLevel } from '@/types/database';
import type { WalkSession } from '@/types/domain';

interface WalkStore {
  activeWalk: WalkSession | null;
  isPaused: boolean;
  elapsedSec: number;
  distanceMeter: number;
  locationBuffer: { latitude: number; longitude: number }[];
  setActiveWalk: (walk: WalkSession | null) => void;
  setPaused: (paused: boolean) => void;
  tickElapsed: () => void;
  addDistance: (meters: number) => void;
  addLocation: (latitude: number, longitude: number) => void;
  flushLocationBuffer: () => { latitude: number; longitude: number }[];
  reset: () => void;
}

export const useWalkStore = create<WalkStore>((set, get) => ({
  activeWalk: null,
  isPaused: false,
  elapsedSec: 0,
  distanceMeter: 0,
  locationBuffer: [],
  setActiveWalk: (walk) => set({ activeWalk: walk }),
  setPaused: (paused) => set({ isPaused: paused }),
  tickElapsed: () => {
    const { isPaused, elapsedSec } = get();
    if (!isPaused) set({ elapsedSec: elapsedSec + 1 });
  },
  addDistance: (meters) => set({ distanceMeter: get().distanceMeter + meters }),
  addLocation: (latitude, longitude) =>
    set({ locationBuffer: [...get().locationBuffer, { latitude, longitude }] }),
  flushLocationBuffer: () => {
    const buffer = get().locationBuffer;
    set({ locationBuffer: [] });
    return buffer;
  },
  reset: () =>
    set({
      activeWalk: null,
      isPaused: false,
      elapsedSec: 0,
      distanceMeter: 0,
      locationBuffer: [],
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
  setBasic: (data: Partial<Pick<OnboardingStore, 'name' | 'breed' | 'birthDate' | 'gender' | 'weightKg' | 'profileImageUri'>>) => void;
  setPersonality: (data: Partial<Pick<OnboardingStore, 'personality' | 'speechStyle' | 'customPersonality' | 'customSpeechStyle'>>) => void;
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
};

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  ...defaultOnboarding,
  setBasic: (data) => set(data),
  setPersonality: (data) => set(data),
  reset: () => set(defaultOnboarding),
}));

interface AuthStore {
  userId: string | null;
  provider: 'kakao' | 'naver' | null;
  setSession: (userId: string, provider: 'kakao' | 'naver') => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  userId: null,
  provider: null,
  setSession: (userId, provider) => set({ userId, provider }),
  clearSession: () => set({ userId: null, provider: null }),
}));

export interface FinishWalkForm {
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
  togglePee: () =>
    set({ form: { ...get().form, peeSelected: !get().form.peeSelected } }),
  togglePoop: () =>
    set({ form: { ...get().form, poopSelected: !get().form.poopSelected } }),
  setDogMeetingLevel: (level) =>
    set({ form: { ...get().form, dogMeetingLevel: level } }),
  setMemo: (memo) => set({ form: { ...get().form, memo } }),
  reset: () => set({ form: defaultFinishForm }),
}));
