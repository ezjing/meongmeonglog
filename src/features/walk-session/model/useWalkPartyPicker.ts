import { useState } from 'react';

import { orderWalkDogs } from '@/entities/dog';
import type { DogProfile } from '@/entities/dog';
import { useOverlay } from '@/shared/ui/overlay';

/** 같은 집 강아지를 고르고, 대표 강아지를 앞에 둔 순서로 돌려준다 */
export function useWalkPartyPicker(dog: DogProfile | null | undefined, dogs: DogProfile[]) {
  const partyDogs = dog ? dogs.filter((item) => item.householdId === dog.householdId) : [];
  const [pickerVisible, setPickerVisible] = useState(false);
  const [checkedDogIds, setCheckedDogIds] = useState<string[]>([]);
  const { showToast } = useOverlay();

  const beginSelection = (onStart: (dogIds: string[]) => void) => {
    if (!dog) return;
    if (partyDogs.length <= 1) {
      onStart([dog.dogId]);
      return;
    }
    setCheckedDogIds([dog.dogId]);
    setPickerVisible(true);
  };

  const toggleDog = (dogId: string) => {
    setCheckedDogIds((current) =>
      current.includes(dogId) ? current.filter((id) => id !== dogId) : [...current, dogId],
    );
  };

  const confirmParty = (onStart: (dogIds: string[]) => void) => {
    if (!dog) return;
    if (checkedDogIds.length === 0) {
      showToast({
        message: '함께 산책할 강아지를 골라 주세요',
        variant: 'warning',
      });
      return;
    }
    const ordered = orderWalkDogs(
      partyDogs.filter((item) => checkedDogIds.includes(item.dogId)),
      dog.dogId,
    ).map((item) => item.dogId);
    setPickerVisible(false);
    onStart(ordered);
  };

  const closePicker = () => setPickerVisible(false);

  return {
    partyDogs,
    pickerVisible,
    checkedDogIds,
    beginSelection,
    toggleDog,
    confirmParty,
    closePicker,
  };
}
