import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/session/sessionStore';

import {
  acceptHouseholdInvite,
  createHouseholdInvite,
  fetchHouseholds,
  leaveHousehold,
  previewHouseholdInvite,
  removeHouseholdMember,
} from './householdApi';

export const householdKeys = {
  all: ['households'] as const,
  list: (userId: string) => [...householdKeys.all, userId] as const,
  preview: (code: string) => [...householdKeys.all, 'preview', code] as const,
};

export function useHouseholds() {
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: householdKeys.list(userId ?? ''),
    queryFn: () => fetchHouseholds(userId!),
    enabled: !!userId,
  });
}

export function useCreateHouseholdInvite() {
  return useMutation({
    mutationFn: (householdId: string) => createHouseholdInvite(householdId),
  });
}

export function useInvitePreview(code: string) {
  return useQuery({
    queryKey: householdKeys.preview(code),
    queryFn: () => previewHouseholdInvite(code),
    enabled: code.length > 0,
    retry: false,
  });
}

export function useAcceptHouseholdInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => acceptHouseholdInvite(code),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: householdKeys.all }),
  });
}

export function useRemoveHouseholdMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ householdId, userId }: { householdId: string; userId: string }) =>
      removeHouseholdMember(householdId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: householdKeys.all }),
  });
}

export function useLeaveHousehold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (householdId: string) => leaveHousehold(householdId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: householdKeys.all }),
  });
}
