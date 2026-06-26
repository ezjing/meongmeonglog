import type { DiaryRow } from '@/types/database';
import type { Diary } from '@/types/domain';

export function toDiary(row: DiaryRow): Diary {
  return {
    diaryId: row.id,
    walkId: row.walk_id,
    dogId: row.dog_id,
    content: row.diary_content,
    dailyQuote: row.daily_quote,
    aiModel: row.ai_model,
    generatedAt: row.generated_at,
    createdAt: row.created_at,
  };
}
