import { supabase } from '@/shared/api/supabase';
import { AppError } from '@/shared/lib/AppError';

interface SharedDiaryPhoto {
  imageUrl: string;
  sortOrder: number;
}

interface SharedDiary {
  dogName: string;
  content: string;
  dailyQuote: string;
  createdAt: string;
  distanceMeter: number | null;
  durationSec: number | null;
  photos: SharedDiaryPhoto[];
}

interface DiaryShareStatus {
  token: string | null;
  revokedAt: string | null;
}

export const shareLinkKeys = {
  status: (diaryId: string) => ['share-link', diaryId] as const,
  publicDiary: (token: string) => ['shared-diary', token] as const,
};

export async function fetchDiaryShareStatus(diaryId: string): Promise<DiaryShareStatus | null> {
  const { data, error } = await supabase
    .from('share_cards')
    .select('token, revoked_at')
    .eq('diary_id', diaryId)
    // 예전 공유 카드 기능이 남긴 토큰 없는 행은 건너뛴다 (ensure_diary_share_link와 같은 기준)
    .not('token', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new AppError('share_status_failed', error.message);
  if (!data) return null;
  return { token: data.token, revokedAt: data.revoked_at };
}

export async function ensureDiaryShareLink(diaryId: string): Promise<string> {
  const { data, error } = await supabase.rpc('ensure_diary_share_link', {
    target_diary_id: diaryId,
  });

  if (error || typeof data !== 'string' || data.length === 0) {
    throw new AppError('share_link_failed', error?.message ?? '공유 링크를 만들지 못했어요.');
  }
  return data;
}

export async function stopDiaryShareLink(diaryId: string): Promise<void> {
  const { error } = await supabase.rpc('stop_diary_share_link', {
    target_diary_id: diaryId,
  });
  if (error) throw new AppError('share_stop_failed', error.message);
}

export async function fetchSharedDiary(token: string): Promise<SharedDiary | null> {
  const { data, error } = await supabase.rpc('get_shared_diary', {
    share_token: token,
  });

  if (error) throw new AppError('shared_diary_failed', error.message);
  if (!data || typeof data !== 'object') return null;

  const row = data as {
    dogName?: string;
    content?: string;
    dailyQuote?: string;
    createdAt?: string;
    distanceMeter?: number | null;
    durationSec?: number | null;
    photos?: { imageUrl?: string; sortOrder?: number }[];
  };

  if (!row.content || !row.createdAt || !row.dogName) return null;

  return {
    dogName: row.dogName,
    content: row.content,
    dailyQuote: row.dailyQuote ?? '',
    createdAt: row.createdAt,
    distanceMeter: row.distanceMeter ?? null,
    durationSec: row.durationSec ?? null,
    photos: (row.photos ?? [])
      .filter((photo) => Boolean(photo.imageUrl))
      .map((photo) => ({
        imageUrl: photo.imageUrl as string,
        sortOrder: photo.sortOrder ?? 0,
      })),
  };
}
