import { create } from 'zustand';

import type { DogMeetingLevel } from '@/shared/api/database';

interface DogFinishEvent {
  peeSelected: boolean;
  poopSelected: boolean;
  dogMeetingLevel: DogMeetingLevel;
}

export interface FinishWalkForm {
  photoUris: string[];
  memo: string;
  eventsByDogId: Record<string, DogFinishEvent>;
}

interface FinishWalkStore {
  form: FinishWalkForm;
  setPhotoUris: (uris: string[]) => void;
  ensureDogs: (dogIds: string[]) => void;
  togglePee: (dogId: string) => void;
  togglePoop: (dogId: string) => void;
  setDogMeetingLevel: (dogId: string, level: DogMeetingLevel) => void;
  setMemo: (memo: string) => void;
  reset: () => void;
}

const defaultDogEvent: DogFinishEvent = {
  peeSelected: false,
  poopSelected: false,
  dogMeetingLevel: 'NONE',
};

const defaultFinishForm: FinishWalkForm = {
  photoUris: [],
  memo: '',
  eventsByDogId: {},
};

export const useFinishWalkStore = create<FinishWalkStore>((set, get) => ({
  form: defaultFinishForm,
  setPhotoUris: (uris) => set({ form: { ...get().form, photoUris: uris } }),
  ensureDogs: (dogIds) => {
    const form = get().form;
    let changed = false;
    const eventsByDogId = { ...form.eventsByDogId };
    for (const dogId of dogIds) {
      if (!eventsByDogId[dogId]) {
        eventsByDogId[dogId] = { ...defaultDogEvent };
        changed = true;
      }
    }
    if (changed) set({ form: { ...form, eventsByDogId } });
  },
  togglePee: (dogId) => {
    const current = get().form.eventsByDogId[dogId] ?? { ...defaultDogEvent };
    set({
      form: {
        ...get().form,
        eventsByDogId: {
          ...get().form.eventsByDogId,
          [dogId]: { ...current, peeSelected: !current.peeSelected },
        },
      },
    });
  },
  togglePoop: (dogId) => {
    const current = get().form.eventsByDogId[dogId] ?? { ...defaultDogEvent };
    set({
      form: {
        ...get().form,
        eventsByDogId: {
          ...get().form.eventsByDogId,
          [dogId]: { ...current, poopSelected: !current.poopSelected },
        },
      },
    });
  },
  setDogMeetingLevel: (dogId, level) => {
    const current = get().form.eventsByDogId[dogId] ?? { ...defaultDogEvent };
    set({
      form: {
        ...get().form,
        eventsByDogId: {
          ...get().form.eventsByDogId,
          [dogId]: { ...current, dogMeetingLevel: level },
        },
      },
    });
  },
  setMemo: (memo) => set({ form: { ...get().form, memo } }),
  reset: () => set({ form: defaultFinishForm }),
}));
