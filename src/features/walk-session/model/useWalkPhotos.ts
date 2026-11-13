import { useEffect, useMemo } from 'react';

import { useWalkPhotosQuery, useWalkStore } from '@/entities/walk';
import type { WalkPhoto } from '@/entities/walk';

import { useFinishWalkStore } from './finishWalkStore';

function localPhotosFromUris(walkId: string, uris: string[]): WalkPhoto[] {
  return uris.map((uri, i) => ({
    id: `local-${walkId}-${i}`,
    walkId,
    imageUrl: uri,
    sortOrder: i,
  }));
}

/**
 * 방금 끝낸 산책의 사진. 서버 사진이 오기 전에는 업로드한 사진(pending)이나
 * 종료 화면에서 고른 로컬 사진을 먼저 보여준다.
 */
export function useWalkPhotos(walkId: string | undefined): WalkPhoto[] {
  const pending = useWalkStore((s) => (walkId ? s.pendingWalkPhotosByWalkId[walkId] : undefined));
  const photoUris = useFinishWalkStore((s) => s.form.photoUris);
  const { data: remotePhotos = [] } = useWalkPhotosQuery(walkId);

  const localPhotos = useMemo(() => {
    if (!walkId) return [];
    return pending && pending.length > 0 ? pending : localPhotosFromUris(walkId, photoUris);
  }, [walkId, pending, photoUris]);

  useEffect(() => {
    if (walkId && remotePhotos.length > 0) {
      useWalkStore.getState().clearPendingWalkPhotos(walkId);
    }
  }, [walkId, remotePhotos.length]);

  if (!walkId) return [];
  return remotePhotos.length > 0 ? remotePhotos : localPhotos;
}
