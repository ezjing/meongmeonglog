import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AnalyticsEvents, trackEvent } from '@/shared/lib/analytics';
import { useAuthStore } from '@/shared/session/sessionStore';

import { generateDiary, invalidateDiaryLists } from './diaryApi';

/** `refreshLists: false`는 여러 마리를 차례로 만들 때. 목록 새로 고침은 호출한 쪽이 한 번만 한다. */
export function useGenerateDiary(options?: { refreshLists?: boolean }) {
  const queryClient = useQueryClient();
  const refreshLists = options?.refreshLists !== false;

  return useMutation({
    mutationFn: generateDiary,
    onSuccess: () => {
      trackEvent(AnalyticsEvents.diaryGenerated);
      if (!refreshLists) return;

      const userId = useAuthStore.getState().userId;
      if (!userId) return;

      // 무한 스크롤은 쌓인 페이지를 비워야 첫 장만 다시 받는다
      invalidateDiaryLists(queryClient, userId);
    },
  });
}
