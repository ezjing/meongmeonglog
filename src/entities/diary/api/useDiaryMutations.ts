import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AnalyticsEvents, trackEvent } from '@/shared/lib/analytics';
import { useAuthStore } from '@/shared/session/sessionStore';

import { generateDiary, invalidateDiaryLists } from './diaryApi';

export function useGenerateDiary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateDiary,
    onSuccess: () => {
      trackEvent(AnalyticsEvents.diaryGenerated);
      const userId = useAuthStore.getState().userId;
      if (!userId) return;

      // 무한 스크롤은 쌓인 페이지를 비워야 첫 장만 다시 받는다
      invalidateDiaryLists(queryClient, userId);
    },
  });
}
