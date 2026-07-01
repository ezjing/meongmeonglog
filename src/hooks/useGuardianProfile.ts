import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchGuardianProfile,
  updateGuardianProfile,
} from "@/lib/api/userApi";
import type { UpdateGuardianProfileInput } from "@/types/domain";
import { useAuthStore } from "@/stores/walkStore";

export const guardianKeys = {
  all: ["guardian"] as const,
  profile: (userId: string) => [...guardianKeys.all, userId] as const,
};

export function useGuardianProfile() {
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: guardianKeys.profile(userId ?? ""),
    queryFn: () => fetchGuardianProfile(userId!),
    enabled: !!userId,
  });
}

export function useUpdateGuardianProfile() {
  const userId = useAuthStore((s) => s.userId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateGuardianProfileInput) =>
      updateGuardianProfile(userId!, input),
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: guardianKeys.profile(userId),
        });
      }
    },
  });
}
