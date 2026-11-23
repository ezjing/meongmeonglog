import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { diaryKeys } from '@/entities/diary';
import type { Diary } from '@/entities/diary';
import { useDeleteWalk } from '@/entities/walk';
import { getLocalDateKey } from '@/shared/lib/localDate';
import { useAuthStore } from '@/shared/session/sessionStore';

/** 이 화면에서 산책 기록을 지우고, 일기 목록 캐시를 맞춘다 */
export function useDeleteDiaryRecord() {
  const queryClient = useQueryClient();
  const deleteWalk = useDeleteWalk();

  const deleteDiaryRecord = useCallback(
    async (diary: Pick<Diary, 'diaryId' | 'walkId' | 'createdAt'>) => {
      await deleteWalk.mutateAsync(diary.walkId);

      const userId = useAuthStore.getState().userId;
      if (!userId) return;

      queryClient.removeQueries({ queryKey: diaryKeys.detail(userId, diary.diaryId) });

      const created = new Date(diary.createdAt);
      void queryClient.invalidateQueries({ queryKey: [...diaryKeys.all, userId, 'recent'] });
      void queryClient.invalidateQueries({
        queryKey: diaryKeys.list(userId, getLocalDateKey(diary.createdAt)),
      });
      void queryClient.invalidateQueries({
        queryKey: diaryKeys.calendar(userId, created.getFullYear(), created.getMonth() + 1),
      });
      void queryClient.resetQueries({ queryKey: [...diaryKeys.all, userId, 'pages'] });
    },
    [deleteWalk, queryClient],
  );

  return { deleteDiaryRecord, isDeleting: deleteWalk.isPending };
}
