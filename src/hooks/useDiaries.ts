import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  diaryKeys,
  fetchDiaries,
  fetchDiary,
  fetchCalendar,
  generateDiary,
  createShareCard,
  fetchWelcomeGreeting,
} from '@/lib/api/diaryApi';
import { AnalyticsEvents, trackEvent } from '@/lib/analytics';

export function useDiaryList(date?: string) {
  return useQuery({
    queryKey: [...diaryKeys.list(), date ?? 'all'],
    queryFn: () => fetchDiaries(date),
  });
}

export function useDiary(diaryId: string) {
  return useQuery({
    queryKey: diaryKeys.detail(diaryId),
    queryFn: () => fetchDiary(diaryId),
    enabled: !!diaryId,
  });
}

export function useCalendar(year: number, month: number) {
  return useQuery({
    queryKey: diaryKeys.calendar(year, month),
    queryFn: () => fetchCalendar(year, month),
  });
}

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

export function useShareCard() {
  return useMutation({
    mutationFn: createShareCard,
    onSuccess: () => trackEvent(AnalyticsEvents.shareCardCreated),
  });
}

export function useWelcomeGreeting() {
  return useMutation({
    mutationFn: ({
      dogName,
      personality,
      speechStyle,
    }: {
      dogName: string;
      personality: string[];
      speechStyle: string | null;
    }) => fetchWelcomeGreeting(dogName, personality, speechStyle),
  });
}
