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

/** 특정 날짜(로컬 YYYY-MM-DD)의 일기 */
export function useDiariesByDate(date: string | undefined) {
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: diaryKeys.list(userId ?? '', date),
    queryFn: () => fetchDiariesByDate(date!),
    enabled: !!userId && !!date,
  });
}

/** 최근 일기 n개 (최신순) */
export function useRecentDiaries(limit: number) {
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: diaryKeys.recent(userId ?? '', limit),
    queryFn: () => fetchDiaryPage(0, { pageSize: limit }),
    enabled: !!userId,
  });
}

/** 스크롤하면 다음 페이지를 불러오는 일기 목록 */
export function useDiaryPages({ ascending = false } = {}) {
  const userId = useAuthStore((s) => s.userId);

  return useInfiniteQuery({
    queryKey: diaryKeys.pages(userId ?? '', ascending),
    queryFn: ({ pageParam }) => fetchDiaryPage(pageParam, { ascending }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < DIARY_PAGE_SIZE ? undefined : allPages.length,
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
