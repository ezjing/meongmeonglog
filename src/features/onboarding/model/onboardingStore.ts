import { create } from 'zustand';

import type { DogGender } from '@/shared/api/database';

/** 강아지 등록·수정 폼 입력값 */
export type OnboardingForm = Pick<
  OnboardingStore,
  | 'name'
  | 'breed'
  | 'birthDate'
  | 'gender'
  | 'weightKg'
  | 'personality'
  | 'speechStyle'
  | 'customPersonality'
  | 'customSpeechStyle'
>;

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
