import { useEffect } from 'react';

import { useSelectedDogStore } from './selectedDogStore';
import { useDogs } from '../api/dogQueries';

/** 고른 강아지. 없거나 지워졌으면 목록의 첫 번째 강아지 */
export function useSelectedDog() {
  const { data: dogs, isLoading } = useDogs();
  const selectedDogId = useSelectedDogStore((s) => s.dogId);
  const hydrated = useSelectedDogStore((s) => s.hydrated);

  useEffect(() => {
    void useSelectedDogStore.getState().hydrate();
  }, []);

  const dog = dogs?.find((item) => item.dogId === selectedDogId) ?? dogs?.[0];

  return { dog, dogs, isLoading, hydrated };
}
