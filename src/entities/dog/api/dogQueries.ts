import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/session/sessionStore';

import { fetchDogs, createDog, updateDog } from './dogApi';
import type { CreateDogInput } from '../model/types';

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
