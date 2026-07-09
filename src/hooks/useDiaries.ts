import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AnalyticsEvents, trackEvent } from '@/lib/analytics';
import {
  diaryKeys,
  fetchDiaries,
  fetchDiary,
  fetchCalendar,
  generateDiary,
  createShareCard,
  fetchWelcomeGreeting,
} from '@/lib/api/diaryApi';
import { useAuthStore } from '@/stores/walkStore';

export function useDiaryList(date?: string) {
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: diaryKeys.list(userId ?? '', date),
    queryFn: () => fetchDiaries(date),
    enabled: !!userId,
  });
}

export function useDiary(diaryId: string) {
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: diaryKeys.detail(userId ?? '', diaryId),
    queryFn: () => fetchDiary(diaryId),
    enabled: !!userId && !!diaryId,
  });
}

export function useCalendar(year: number, month: number) {
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: diaryKeys.calendar(userId ?? '', year, month),
    queryFn: () => fetchCalendar(year, month),
    enabled: !!userId,
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
