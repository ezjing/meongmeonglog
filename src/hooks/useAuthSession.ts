import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  signInWithProvider,
  signOut,
  deleteAccount,
  getCurrentUserEmail,
  getCurrentUserId,
} from '@/lib/api/authApi';
import { fetchDogs, createDog, updateDog } from '@/lib/api/dogApi';
import { useAuthStore, useWalkStore } from '@/stores/walkStore';
import type { AuthProvider } from '@/types/database';
import type { CreateDogInput } from '@/types/domain';

export function useAuthSession() {
  const queryClient = useQueryClient();
  const { userId, provider, setSession, clearSession } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: ({ provider, accessToken }: { provider: AuthProvider; accessToken: string }) =>
      signInWithProvider(provider, accessToken),
    onSuccess: (session) => {
      queryClient.clear();
      setSession(session.userId, session.provider);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      clearSession();
      useWalkStore.getState().reset();
      queryClient.clear();
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      clearSession();
      useWalkStore.getState().reset();
      queryClient.clear();
    },
  });

  return {
    userId,
    provider,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    deleteAccount: deleteAccountMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isDeletingAccount: deleteAccountMutation.isPending,
  };
}

export function useAccountEmail() {
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: ['accountEmail', userId],
    queryFn: getCurrentUserEmail,
    enabled: !!userId,
  });
}

export function useDogs() {
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: ['dogs', userId],
    queryFn: () => fetchDogs(userId!),
    enabled: !!userId,
  });
}

export function useCreateDog() {
  const userId = useAuthStore((s) => s.userId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDogInput) => createDog(userId!, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dogs'] }),
  });
}

export function useUpdateDog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dogId, input }: { dogId: string; input: Partial<CreateDogInput> }) =>
      updateDog(dogId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dogs'] }),
  });
}

export async function resolveUserId(): Promise<string | null> {
  const stored = useAuthStore.getState().userId;
  if (stored) return stored;
  return getCurrentUserId();
}
