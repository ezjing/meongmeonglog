import { useCallback } from 'react';

import { isHouseholdAdmin, useHouseholds } from '@/entities/household';
import { openDogEdit } from '@/shared/lib/navigation';
import { useOverlay } from '@/shared/ui/overlay';

const DOG_EDIT_ADMIN_MESSAGE = '강아지 정보는 집 관리자만 바꿀 수 있어요';

/** 집 관리자가 아니면 안내만 하고, 관리자면 강아지 정보 수정 화면으로 간다 */
export function useOpenDogEdit() {
  const { data: households } = useHouseholds();
  const { showToast } = useOverlay();

  return useCallback(
    (dog: { dogId: string; householdId: string }) => {
      if (households && !isHouseholdAdmin(households, dog.householdId)) {
        showToast({ message: DOG_EDIT_ADMIN_MESSAGE, variant: 'warning' });
        return;
      }
      openDogEdit(dog.dogId);
    },
    [households, showToast],
  );
}
