import type { DiaryRow } from '@/shared/api/database';

import type { Diary } from '../model/types';

export function toDiary(row: DiaryRow): Diary {
  return {
    diaryId: row.id,
    walkId: row.walk_id,
    dogId: row.dog_id,
    content: row.diary_content,
    dailyQuote: row.daily_quote,
    createdAt: row.created_at,
  };
}
