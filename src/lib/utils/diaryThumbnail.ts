import type { DiaryListItem } from '@/types/domain';
import type { WalkPhoto } from '@/types/domain';

export function resolveDiaryThumbnail(
  diary: Pick<DiaryListItem, 'walkId' | 'thumbnailUrl'>,
  pendingPhotosByWalkId: Record<string, WalkPhoto[]> = {},
): string | null {
  return (
    diary.thumbnailUrl ??
    pendingPhotosByWalkId[diary.walkId]?.[0]?.imageUrl ??
    null
  );
}
