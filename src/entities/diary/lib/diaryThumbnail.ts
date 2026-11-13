import type { WalkPhoto } from '@/entities/walk/@x/diary';

import type { DiaryListItem } from '../model/types';

export function resolveDiaryThumbnail(
  diary: Pick<DiaryListItem, 'walkId' | 'thumbnailUrl'>,
  pendingPhotosByWalkId: Record<string, WalkPhoto[]> = {},
): string | null {
  return diary.thumbnailUrl ?? pendingPhotosByWalkId[diary.walkId]?.[0]?.imageUrl ?? null;
}
