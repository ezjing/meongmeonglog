import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/session/sessionStore';

import {
  DIARY_PAGE_SIZE,
  diaryKeys,
  fetchCalendar,
  fetchDiariesByDate,
  fetchDiary,
  fetchDiaryPage,
} from './diaryApi';

/** 특정 날짜(로컬 YYYY-MM-DD)·강아지의 일기 */
export function useDiariesByDate(date: string | undefined, dogId: string | undefined) {
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: diaryKeys.list(userId ?? '', dogId ?? '', date),
    queryFn: () => fetchDiariesByDate(date!, dogId!),
    enabled: !!userId && !!date && !!dogId,
  });
}

/** 최근 일기 n개 (최신순, 선택한 강아지) */
export function useRecentDiaries(limit: number, dogId: string | undefined) {
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: diaryKeys.recent(userId ?? '', dogId ?? '', limit),
    queryFn: () => fetchDiaryPage(0, { pageSize: limit, dogId: dogId! }),
    enabled: !!userId && !!dogId,
  });
}

/** 스크롤하면 다음 페이지를 불러오는 일기 목록 */
export function useDiaryPages(dogId: string | undefined, { ascending = false } = {}) {
  const userId = useAuthStore((s) => s.userId);

  return useInfiniteQuery({
    queryKey: diaryKeys.pages(userId ?? '', dogId ?? '', ascending),
    queryFn: ({ pageParam }) => fetchDiaryPage(pageParam, { ascending, dogId: dogId! }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < DIARY_PAGE_SIZE ? undefined : allPages.length,
    enabled: !!userId && !!dogId,
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

export function useCalendar(year: number, month: number, dogId: string | undefined) {
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: diaryKeys.calendar(userId ?? '', dogId ?? '', year, month),
    queryFn: () => fetchCalendar(year, month, dogId!),
    enabled: !!userId && !!dogId,
  });
}
