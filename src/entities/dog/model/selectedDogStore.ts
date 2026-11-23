import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const SELECTED_DOG_KEY = 'meongmeonglog.selectedDogId';

interface SelectedDogStore {
  /** 마지막으로 고른 강아지. 목록에 없으면 화면은 첫 번째 강아지를 보여 준다 */
  dogId: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSelectedDogId: (dogId: string) => void;
}

let hydrating: Promise<void> | null = null;

export const useSelectedDogStore = create<SelectedDogStore>((set, get) => ({
  dogId: null,
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return Promise.resolve();
    if (!hydrating) {
      hydrating = AsyncStorage.getItem(SELECTED_DOG_KEY).then((id) => {
        set((state) => ({
          dogId: state.dogId ?? id,
          hydrated: true,
        }));
      });
    }
    return hydrating;
  },
  setSelectedDogId: (dogId) => {
    set({ dogId, hydrated: true });
    void AsyncStorage.setItem(SELECTED_DOG_KEY, dogId);
  },
}));
