import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { diaryKeys, invalidateDiaryLists } from '@/entities/diary';
import type { Diary } from '@/entities/diary';
import { useDeleteDiaryFromWalk } from '@/entities/walk';
import { useAuthStore } from '@/shared/session/sessionStore';

/** 이 화면에서 산책 기록을 지우고, 일기 목록 캐시를 맞춘다 */
export function useDeleteDiaryRecord() {
  const queryClient = useQueryClient();
  const deleteDiary = useDeleteDiaryFromWalk();

  const deleteDiaryRecord = useCallback(
    async (diary: Pick<Diary, 'diaryId' | 'walkId'>) => {
      await deleteDiary.mutateAsync({ diaryId: diary.diaryId, walkId: diary.walkId });

      const userId = useAuthStore.getState().userId;
      if (!userId) return;

      queryClient.removeQueries({ queryKey: diaryKeys.detail(userId, diary.diaryId) });
      invalidateDiaryLists(queryClient, userId);
    },
    [deleteDiary, queryClient],
  );

  return { deleteDiaryRecord, isDeleting: deleteDiary.isPending };
}
