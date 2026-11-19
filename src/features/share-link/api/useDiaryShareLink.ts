import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';

import {
  ensureDiaryShareLink,
  fetchDiaryShareStatus,
  shareLinkKeys,
  stopDiaryShareLink,
} from './shareLinkApi';
import { copyDiaryUrlWhenReady, presentDiaryShare, shareDiaryUrl } from '../lib/shareDiaryUrl';

export function useDiaryShareLink(diaryId: string) {
  const queryClient = useQueryClient();
  const status = useQuery({
    queryKey: shareLinkKeys.status(diaryId),
    queryFn: () => fetchDiaryShareStatus(diaryId),
    enabled: diaryId.length > 0,
  });

  const share = useMutation({
    mutationFn: () => ensureDiaryShareLink(diaryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shareLinkKeys.status(diaryId) });
    },
  });

  const stop = useMutation({
    mutationFn: () => stopDiaryShareLink(diaryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shareLinkKeys.status(diaryId) });
    },
  });

  const isActive = Boolean(status.data?.token) && status.data?.revokedAt == null;

  /**
   * 공유 시트·클립보드는 탭 직후에만 열 수 있어서(iPhone Safari) 서버 응답을 기다리기 전에 연다.
   * - 이미 켜진 링크: 저장된 주소로 바로 연다
   * - 처음 공유하거나 중지했던 링크(웹): 복사를 먼저 예약하고 주소는 서버 응답으로 채운다
   */
  const shareNow = async (): Promise<'shared' | 'copied'> => {
    const activeToken = isActive ? status.data?.token : undefined;
    if (activeToken) {
      return presentDiaryShare(shareDiaryUrl(activeToken));
    }
    if (Platform.OS === 'web') {
      return copyDiaryUrlWhenReady(share.mutateAsync().then(shareDiaryUrl));
    }
    const token = await share.mutateAsync();
    return presentDiaryShare(shareDiaryUrl(token));
  };

  return { isActive, share, stop, shareNow };
}
