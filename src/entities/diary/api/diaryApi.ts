import { DEFAULT_DOG_NAME } from '@/entities/dog/@x/diary';
import { fetchWalkPhotos, getMockWalk } from '@/entities/walk/@x/diary';
import type { DiaryRow } from '@/shared/api/database';
import { getEdgeFunctionErrorMessage } from '@/shared/api/edgeFunctions';
import { isSupabaseConfigured, supabase } from '@/shared/api/supabase';
import { AppError } from '@/shared/lib/AppError';
import { getLocalDateKey, getLocalDateRangeIso } from '@/shared/lib/localDate';

import { toDiary } from '../lib/diaryMappers';
import type { CalendarDay, Diary, DiaryDetail, DiaryListItem } from '../model/types';

const mockDiaries: DiaryDetail[] = [];

/** 리스트 화면에서 한 번에 불러오는 일기 수 */
export const DIARY_PAGE_SIZE = 20;

type WalkPhotoRow = { id?: string; image_url: string; sort_order: number };

type WalkWithPhotos = {
  distance_meter: number;
  duration_sec: number;
  walk_photos: WalkPhotoRow[] | null;
};

// 목록: 본문 없이 필요한 컬럼만, 산책 사진은 썸네일용 첫 장만 받는다
const LIST_SELECT =
  'id, walk_id, dog_id, daily_quote, created_at, walks(distance_meter, duration_sec, walk_photos(image_url, sort_order)), dogs(name)';
const FIRST_PHOTO_ONLY = { referencedTable: 'walks.walk_photos' };

function sortPhotos(walkPhotos: WalkPhotoRow[] | null | undefined): WalkPhotoRow[] {
  return [...(walkPhotos ?? [])].sort((a, b) => a.sort_order - b.sort_order);
}

function mapListRow(row: Record<string, unknown>): DiaryListItem {
  const walks = row.walks as WalkWithPhotos | null;
  const dogs = row.dogs as { name: string } | null;
  return {
    diaryId: row.id as string,
    walkId: row.walk_id as string,
    dogId: row.dog_id as string,
    dailyQuote: row.daily_quote as string,
    createdAt: row.created_at as string,
    dogName: dogs?.name,
    distanceMeter: walks?.distance_meter,
    durationSec: walks?.duration_sec,
    thumbnailUrl: sortPhotos(walks?.walk_photos)[0]?.image_url ?? null,
  };
}

function toListItem({ content: _content, photos: _photos, ...item }: DiaryDetail): DiaryListItem {
  return item;
}

export const diaryKeys = {
  all: ['diaries'] as const,
  list: (userId: string, date?: string) =>
    [...diaryKeys.all, userId, 'list', date ?? 'all'] as const,
  recent: (userId: string, limit: number) => [...diaryKeys.all, userId, 'recent', limit] as const,
  pages: (userId: string, ascending: boolean) =>
    [...diaryKeys.all, userId, 'pages', ascending ? 'asc' : 'desc'] as const,
  detail: (userId: string, id: string) => [...diaryKeys.all, userId, id] as const,
  calendar: (userId: string, year: number, month: number) =>
    [...diaryKeys.all, userId, 'calendar', year, month] as const,
};

/** 특정 날짜(로컬 기준 YYYY-MM-DD)의 일기, 최신순 */
export async function fetchDiariesByDate(date: string): Promise<DiaryListItem[]> {
  if (!isSupabaseConfigured) {
    return mockDiaries.filter((d) => getLocalDateKey(d.createdAt) === date).map(toListItem);
  }

  const { from, to } = getLocalDateRangeIso(date);
  const { data, error } = await supabase
    .from('diaries')
    .select(LIST_SELECT)
    .gte('created_at', from)
    .lt('created_at', to)
    .order('created_at', { ascending: false })
    .order('sort_order', FIRST_PHOTO_ONLY)
    .limit(1, FIRST_PHOTO_ONLY);

  if (error) throw new AppError('fetch_diaries_failed', error.message);
  return (data ?? []).map((row) => mapListRow(row as Record<string, unknown>));
}

/** 일기 목록 한 페이지. page는 0부터 */
export async function fetchDiaryPage(
  page: number,
  { ascending = false, pageSize = DIARY_PAGE_SIZE } = {},
): Promise<DiaryListItem[]> {
  const from = page * pageSize;

  if (!isSupabaseConfigured) {
    const sorted = [...mockDiaries].sort((a, b) =>
      ascending ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt),
    );
    return sorted.slice(from, from + pageSize).map(toListItem);
  }

  const { data, error } = await supabase
    .from('diaries')
    .select(LIST_SELECT)
    .order('created_at', { ascending })
    .order('sort_order', FIRST_PHOTO_ONLY)
    .limit(1, FIRST_PHOTO_ONLY)
    .range(from, from + pageSize - 1);

  if (error) throw new AppError('fetch_diaries_failed', error.message);
  return (data ?? []).map((row) => mapListRow(row as Record<string, unknown>));
}

export async function fetchDiary(diaryId: string): Promise<DiaryDetail | null> {
  if (!isSupabaseConfigured) {
    return mockDiaries.find((d) => d.diaryId === diaryId) ?? null;
  }

  const { data, error } = await supabase
    .from('diaries')
    .select(
      'id, walk_id, dog_id, diary_content, daily_quote, created_at, walks(distance_meter, duration_sec, walk_photos(id, image_url, sort_order)), dogs(name)',
    )
    .eq('id', diaryId)
    .maybeSingle();

  if (error) throw new AppError('fetch_diary_failed', error.message);
  if (!data) return null;

  const row = data as Record<string, unknown>;
  const diary = toDiary(row as unknown as DiaryRow);
  const walks = row.walks as WalkWithPhotos | null;
  const photos = sortPhotos(walks?.walk_photos).map((photo) => ({
    id: photo.id ?? `${diary.walkId}-${photo.sort_order}`,
    walkId: diary.walkId,
    imageUrl: photo.image_url,
    sortOrder: photo.sort_order,
  }));
  return {
    ...diary,
    dogName: (row.dogs as { name: string } | null)?.name,
    distanceMeter: walks?.distance_meter,
    durationSec: walks?.duration_sec,
    thumbnailUrl: photos[0]?.imageUrl ?? null,
    photos,
  };
}

function buildCalendarDays(year: number, month: number, diaryDates: Set<string>): CalendarDay[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const date = getLocalDateKey(new Date(year, month - 1, i + 1));
    return { date, hasDiary: diaryDates.has(date) };
  });
}

export async function fetchCalendar(year: number, month: number): Promise<CalendarDay[]> {
  if (!isSupabaseConfigured) {
    return buildCalendarDays(
      year,
      month,
      new Set(mockDiaries.map((d) => getLocalDateKey(d.createdAt))),
    );
  }

  const start = getLocalDateKey(new Date(year, month - 1, 1));
  const end = getLocalDateKey(new Date(year, month, 0));
  const { from, to } = getLocalDateRangeIso(start, end);
  const { data, error } = await supabase
    .from('diaries')
    .select('created_at')
    .gte('created_at', from)
    .lt('created_at', to);

  if (error) throw new AppError('fetch_calendar_failed', error.message);

  return buildCalendarDays(
    year,
    month,
    new Set((data ?? []).map((d) => getLocalDateKey(d.created_at))),
  );
}

export async function generateDiary(walkId: string): Promise<Diary> {
  if (!isSupabaseConfigured) {
    const photos = await fetchWalkPhotos(walkId);
    const walk = getMockWalk(walkId);
    const diary: DiaryDetail = {
      diaryId: `diary-${Date.now()}`,
      walkId,
      dogId: 'mock-dog',
      content:
        '오늘은 엄마랑 공원에 다녀왔어! 친구도 만나고 잔디밭도 열심히 뛰어다녔지. 간식도 먹고 냄새 탐험도 많이 해서 정말 즐거운 하루였어!',
      dailyQuote: '친구는 냄새만 맡아도 알 수 있대!',
      createdAt: new Date().toISOString(),
      dogName: DEFAULT_DOG_NAME,
      distanceMeter: walk?.distanceMeter ?? null,
      durationSec: walk?.durationSec ?? null,
      thumbnailUrl: photos[0]?.imageUrl ?? null,
      photos,
    };
    mockDiaries.unshift(diary);
    return diary;
  }

  const { data, error } = await supabase.functions.invoke('diaries-generate', {
    body: { walkId },
  });

  if (error || (data as { error?: string } | null)?.error) {
    const message = await getEdgeFunctionErrorMessage(data, error, '일기 생성에 실패했습니다.');
    throw new AppError('diary_generate_failed', message);
  }

  const result = data as {
    diaryId: string;
    content: string;
    dailyQuote: string;
  };
  return {
    diaryId: result.diaryId,
    walkId,
    dogId: '',
    content: result.content,
    dailyQuote: result.dailyQuote,
    createdAt: new Date().toISOString(),
  };
}
