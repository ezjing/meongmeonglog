import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AuthProvider } from '@/shared/api/database';
import { useAuthStore } from '@/shared/session/sessionStore';

import { signInWithProvider, signOut, deleteAccount, getCurrentUserEmail } from '../api/authApi';
import { resetClientAuthState } from '../lib/resetClientAuthState';

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
    queryFn: () => getCurrentUserEmail(userId!),
    enabled: !!userId,
  });
}
