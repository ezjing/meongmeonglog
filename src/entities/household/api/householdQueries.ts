import { useMutation, useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/session/sessionStore';

import { createHouseholdInvite, fetchHouseholds, previewHouseholdInvite } from './householdApi';

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

export function useInvitePreview(code: string, enabled = true) {
  return useQuery({
    queryKey: householdKeys.preview(code),
    queryFn: () => previewHouseholdInvite(code),
    enabled: enabled && code.length > 0,
    retry: false,
  });
}
