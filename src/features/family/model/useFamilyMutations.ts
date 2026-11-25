import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';

import { diaryKeys } from '@/entities/diary';
import { dogKeys } from '@/entities/dog';
import {
  acceptHouseholdInvite,
  householdKeys,
  leaveHousehold,
  removeHouseholdMember,
} from '@/entities/household';
import { activeWalksQueryKey } from '@/entities/walk';
import { useAuthStore } from '@/shared/session/sessionStore';

function refreshFamilyQueries(queryClient: QueryClient) {
  const userId = useAuthStore.getState().userId ?? '';
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: householdKeys.list(userId) }),
    queryClient.invalidateQueries({ queryKey: dogKeys.all }),
    queryClient.invalidateQueries({ queryKey: diaryKeys.all }),
    queryClient.invalidateQueries({ queryKey: activeWalksQueryKey }),
  ]);
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => acceptHouseholdInvite(code),
    onSuccess: (_householdId, code) => {
      queryClient.removeQueries({ queryKey: householdKeys.preview(code) });
      return refreshFamilyQueries(queryClient);
    },
  });
}

export function useLeaveHousehold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (householdId: string) => leaveHousehold(householdId),
    onSuccess: () => refreshFamilyQueries(queryClient),
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ householdId, userId }: { householdId: string; userId: string }) =>
      removeHouseholdMember(householdId, userId),
    onSuccess: () => refreshFamilyQueries(queryClient),
  });
}
