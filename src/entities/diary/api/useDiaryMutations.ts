import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AnalyticsEvents, trackEvent } from '@/shared/lib/analytics';
import { getLocalDateKey } from '@/shared/lib/localDate';
import { useAuthStore } from '@/shared/session/sessionStore';

import { diaryKeys, generateDiary } from './diaryApi';

export function useGenerateDiary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateDiary,
    onSuccess: () => {
      trackEvent(AnalyticsEvents.diaryGenerated);
      const userId = useAuthStore.getState().userId;
      if (!userId) return;

      const today = getLocalDateKey();
      const now = new Date();
      void queryClient.invalidateQueries({ queryKey: [...diaryKeys.all, userId, 'recent'] });
      void queryClient.invalidateQueries({ queryKey: diaryKeys.list(userId, today) });
      void queryClient.invalidateQueries({
        queryKey: diaryKeys.calendar(userId, now.getFullYear(), now.getMonth() + 1),
      });
      // 무한 스크롤은 쌓인 페이지를 비워야 첫 장만 다시 받는다
      void queryClient.resetQueries({ queryKey: [...diaryKeys.all, userId, 'pages'] });
    },
  });
}
