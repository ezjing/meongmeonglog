import type { WalkPhoto } from '@/entities/walk/@x/diary';

export interface Diary {
  diaryId: string;
  walkId: string;
  dogId: string;
  content: string;
  dailyQuote: string;
  createdAt: string;
}

/** 목록용 일기 (본문 제외, 첫 사진만) */
export interface DiaryListItem extends Omit<Diary, 'content'> {
  dogName?: string;
  distanceMeter?: number | null;
  durationSec?: number | null;
  thumbnailUrl?: string | null;
}

/** 상세용 일기 (본문 + 산책 사진 전체) */
export interface DiaryDetail extends Diary {
  dogName?: string;
  distanceMeter?: number | null;
  durationSec?: number | null;
  thumbnailUrl?: string | null;
  photos: WalkPhoto[];
}

export interface CalendarDay {
  date: string;
  hasDiary: boolean;
}
