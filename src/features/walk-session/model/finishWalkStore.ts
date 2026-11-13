import { create } from 'zustand';

import type { DogMeetingLevel } from '@/shared/api/database';

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
