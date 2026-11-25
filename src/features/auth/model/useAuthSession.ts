import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AuthProvider } from '@/shared/api/database';
import { useAuthStore } from '@/shared/session/sessionStore';

import {
  signInWithProvider,
  signInWithAuthCode,
  signInWithAppCode,
  signOut,
  deleteAccount,
  getCurrentUserEmail,
} from '../api/authApi';
import { resetClientAuthState } from '../lib/resetClientAuthState';

const accountEmailKeys = {
  all: ['accountEmail'] as const,
  byUser: (userId: string) => [...accountEmailKeys.all, userId] as const,
};

export function useAuthSession() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.userId);
  const provider = useAuthStore((s) => s.provider);
  const setSession = useAuthStore((s) => s.setSession);

  const loginMutation = useMutation({
    mutationFn: ({ provider, accessToken }: { provider: AuthProvider; accessToken: string }) =>
      signInWithProvider(provider, accessToken),
    onSuccess: (session) => {
      queryClient.clear();
      setSession(session.userId, session.provider);
    },
  });

  const loginWithCodeMutation = useMutation({
    mutationFn: signInWithAuthCode,
    onSuccess: (session) => {
      queryClient.clear();
      setSession(session.userId, session.provider);
    },
  });

  const loginWithAppCodeMutation = useMutation({
    mutationFn: signInWithAppCode,
    onSuccess: (session) => {
      queryClient.clear();
      setSession(session.userId, session.provider);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: signOut,
    onSuccess: resetClientAuthState,
  });

  const deleteAccountMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: resetClientAuthState,
  });

  return {
    userId,
    provider,
    login: loginMutation.mutateAsync,
    loginWithCode: loginWithCodeMutation.mutateAsync,
    loginWithAppCode: loginWithAppCodeMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    deleteAccount: deleteAccountMutation.mutateAsync,
    isLoggingIn:
      loginMutation.isPending ||
      loginWithCodeMutation.isPending ||
      loginWithAppCodeMutation.isPending,
    isDeletingAccount: deleteAccountMutation.isPending,
  };
}

export function useAccountEmail() {
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: accountEmailKeys.byUser(userId ?? ''),
    queryFn: () => getCurrentUserEmail(userId!),
    enabled: !!userId,
  });
}
