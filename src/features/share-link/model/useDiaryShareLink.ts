import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  ensureDiaryShareLink,
  fetchDiaryShareStatus,
  shareLinkKeys,
  stopDiaryShareLink,
} from '../api/shareLinkApi';

export function useDiaryShareLink(diaryId: string) {
  const queryClient = useQueryClient();
  const status = useQuery({
    queryKey: shareLinkKeys.status(diaryId),
    queryFn: () => fetchDiaryShareStatus(diaryId),
    enabled: diaryId.length > 0,
  });

  const share = useMutation({
    mutationFn: () => ensureDiaryShareLink(diaryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shareLinkKeys.status(diaryId) });
    },
  });

  const stop = useMutation({
    mutationFn: () => stopDiaryShareLink(diaryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shareLinkKeys.status(diaryId) });
    },
  });

  const isActive = Boolean(status.data?.token) && status.data?.revokedAt == null;

  return { isActive, share, stop };
}
