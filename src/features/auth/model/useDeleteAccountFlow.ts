import { router } from 'expo-router';
import { useState } from 'react';

import { useDogs } from '@/entities/dog';
import { householdsNeedingSuccessor, useHouseholds } from '@/entities/household';
import { useOverlay } from '@/shared/ui/overlay';

import { useAuthSession } from './useAuthSession';

/** 가족이 있는 관리자 집은 맡을 사람을 고른 뒤 탈퇴한다 */
export function useDeleteAccountFlow() {
  const { userId, deleteAccount, isDeletingAccount } = useAuthSession();
  const { data: dogs = [] } = useDogs();
  const {
    data: households,
    isLoading: isHouseholdLoading,
    isError: isHouseholdError,
  } = useHouseholds();
  const { showAlert, showToast } = useOverlay();
  const [pickIndex, setPickIndex] = useState<number | null>(null);
  const [pickedSuccessor, setPickedSuccessor] = useState<Record<string, string>>({});

  const successorHouses = householdsNeedingSuccessor(households ?? [], userId);
  const pickingHouse = pickIndex != null ? successorHouses[pickIndex] : null;

  const confirmDelete = async (
    pickedNewAdmin: boolean,
    successors: { householdId: string; userId: string }[],
  ) => {
    const groups = households ?? [];
    const hasSharedHouse = groups.some((group) =>
      group.members.some((member) => member.userId !== userId),
    );
    const hasSoloHouse = groups.some(
      (group) =>
        group.members.length > 0 && group.members.every((member) => member.userId === userId),
    );
    const message = [
      pickedNewAdmin ? '선택한 가족이 그 집의 강아지를 맡아요.' : null,
      hasSharedHouse ? '가족과 함께 쓰는 집에 남긴 기록은 그대로 남아요.' : null,
      hasSoloHouse ? '혼자 쓰는 집의 강아지와 기록은 모두 삭제돼요.' : null,
      '계정과 개인정보는 삭제되어 되돌릴 수 없어요.',
    ]
      .filter((part): part is string => part != null)
      .join(' ');
    const confirmed = await showAlert({
      icon: '⚠️',
      title: '정말 탈퇴하시겠어요?',
      message,
      cancelLabel: '취소',
      confirmLabel: '탈퇴하기',
      destructive: true,
    });
    if (!confirmed) return;

    try {
      await deleteAccount(successors);
      router.replace('/(auth)/login');
    } catch {
      showToast({ message: '계정 삭제에 실패했어요. 다시 시도해주세요.', variant: 'error' });
    }
  };

  const handleDeleteAccount = () => {
    if (isHouseholdLoading) return;
    if (isHouseholdError || !households) {
      showToast({ message: '가족 정보를 불러오지 못했어요', variant: 'error' });
      return;
    }
    if (successorHouses.length === 0) {
      void confirmDelete(false, []);
      return;
    }
    setPickedSuccessor({});
    setPickIndex(0);
  };

  const handleSuccessorNext = () => {
    if (pickingHouse == null || pickIndex == null) return;
    const successorId = pickedSuccessor[pickingHouse.householdId];
    if (!successorId) return;
    if (pickIndex < successorHouses.length - 1) {
      setPickIndex(pickIndex + 1);
      return;
    }
    const successors = successorHouses.map((group) => ({
      householdId: group.householdId,
      userId: pickedSuccessor[group.householdId] ?? '',
    }));
    setPickIndex(null);
    void confirmDelete(true, successors);
  };

  return {
    handleDeleteAccount,
    isDeletingAccount,
    successorSheet: {
      house: pickingHouse,
      dogs,
      userId,
      selectedUserId: pickingHouse ? pickedSuccessor[pickingHouse.householdId] : undefined,
      onSelect: (memberId: string) => {
        if (!pickingHouse) return;
        setPickedSuccessor((current) => ({ ...current, [pickingHouse.householdId]: memberId }));
      },
      onNext: handleSuccessorNext,
      onClose: () => setPickIndex(null),
    },
  };
}
