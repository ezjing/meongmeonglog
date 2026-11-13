export interface Diary {
  diaryId: string;
  walkId: string;
  dogId: string;
  content: string;
  dailyQuote: string;
  createdAt: string;
}

export interface DiaryListItem extends Diary {
  dogName?: string;
  distanceMeter?: number | null;
  durationSec?: number | null;
  thumbnailUrl?: string | null;
}

export interface CalendarDay {
  date: string;
  hasDiary: boolean;
}
