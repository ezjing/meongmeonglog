import { useMutation, useQueryClient } from '@tanstack/react-query';

import { diaryKeys, generateDiary } from '@/entities/diary';
import { AnalyticsEvents, trackEvent } from '@/shared/lib/analytics';

export function useGenerateDiary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateDiary,
    onSuccess: () => {
      trackEvent(AnalyticsEvents.diaryGenerated);
      queryClient.invalidateQueries({ queryKey: diaryKeys.all });
    },
  });
}
