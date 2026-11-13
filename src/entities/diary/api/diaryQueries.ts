import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/session/sessionStore';

import { diaryKeys, fetchDiaries, fetchDiary, fetchCalendar } from './diaryApi';

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
