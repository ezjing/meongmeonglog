import { DEFAULT_DOG_NAME } from '@/entities/dog/@x/diary';
import { fetchWalkPhotos, getMockWalk } from '@/entities/walk/@x/diary';
import type { DiaryRow } from '@/shared/api/database';
import { getEdgeFunctionErrorMessage } from '@/shared/api/edgeFunctions';
import { isSupabaseConfigured, supabase } from '@/shared/api/supabase';
import { AppError } from '@/shared/lib/AppError';
import { getLocalDateKey, getLocalDateRangeIso } from '@/shared/lib/localDate';

import { toDiary } from '../lib/diaryMappers';
import type { CalendarDay, Diary, DiaryListItem } from '../model/types';

const mockDiaries: DiaryListItem[] = [];

type WalkPhotoRow = { image_url: string; sort_order: number };

type WalkWithPhotos = {
  distance_meter: number;
  duration_sec: number;
  walk_photos: WalkPhotoRow[] | null;
};

function pickThumbnailUrl(walkPhotos: WalkPhotoRow[] | null | undefined): string | null {
  if (!walkPhotos?.length) return null;
  return [...walkPhotos].sort((a, b) => a.sort_order - b.sort_order)[0]?.image_url ?? null;
}

async function attachMockThumbnail(diary: DiaryListItem): Promise<DiaryListItem> {
  const photos = await fetchWalkPhotos(diary.walkId);
  return {
    ...diary,
    thumbnailUrl: photos[0]?.imageUrl ?? null,
  };
}

async function attachMockThumbnails(diaries: DiaryListItem[]): Promise<DiaryListItem[]> {
  return Promise.all(diaries.map(attachMockThumbnail));
}

function mapDiaryRow(row: Record<string, unknown>): DiaryListItem {
  const diary = toDiary(row as unknown as DiaryRow);
  const walks = row.walks as WalkWithPhotos | null;
  const dogs = row.dogs as { name: string } | null;
  return {
    ...diary,
    dogName: dogs?.name,
    distanceMeter: walks?.distance_meter,
    durationSec: walks?.duration_sec,
    thumbnailUrl: pickThumbnailUrl(walks?.walk_photos),
  };
}

export const diaryKeys = {
  all: ['diaries'] as const,
  list: (userId: string, date?: string) =>
    [...diaryKeys.all, userId, 'list', date ?? 'all'] as const,
  detail: (userId: string, id: string) => [...diaryKeys.all, userId, id] as const,
  calendar: (userId: string, year: number, month: number) =>
    [...diaryKeys.all, userId, 'calendar', year, month] as const,
};

export async function fetchDiaries(date?: string): Promise<DiaryListItem[]> {
  if (!isSupabaseConfigured) {
    const filtered = date
      ? mockDiaries.filter((d) => d.createdAt.startsWith(date))
      : [...mockDiaries].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    return attachMockThumbnails(filtered);
  }

  let query = supabase
    .from('diaries')
    .select(
      '*, walks(distance_meter, duration_sec, walk_photos(image_url, sort_order)), dogs(name)',
    )
    .order('created_at', { ascending: false });

  if (date) {
    const { from, to } = getLocalDateRangeIso(date);
    query = query.gte('created_at', from).lt('created_at', to);
  }

  const { data, error } = await query;
  if (error) throw new AppError('fetch_diaries_failed', error.message);

  return (data ?? []).map((row) => mapDiaryRow(row as Record<string, unknown>));
}

export async function fetchDiary(diaryId: string): Promise<DiaryListItem | null> {
  if (!isSupabaseConfigured) {
    const diary = mockDiaries.find((d) => d.diaryId === diaryId);
    if (!diary) return null;
    return attachMockThumbnail(diary);
  }

  const { data, error } = await supabase
    .from('diaries')
    .select('*, walks(*, walk_photos(image_url, sort_order)), dogs(name)')
    .eq('id', diaryId)
    .maybeSingle();

  if (error) throw new AppError('fetch_diary_failed', error.message);
  if (!data) return null;

  return mapDiaryRow(data as Record<string, unknown>);
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
    const diary: DiaryListItem = {
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

export async function createShareCard(diaryId: string): Promise<string> {
  if (!isSupabaseConfigured) {
    return `https://placeholder.share/${diaryId}.png`;
  }

  const { data, error } = await supabase.functions.invoke('share-card', {
    body: { diaryId },
  });

  if (error) throw new AppError('share_card_failed', error.message);
  return (data as { imageUrl: string }).imageUrl;
}
