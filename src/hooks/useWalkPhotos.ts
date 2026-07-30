import { useEffect, useMemo, useState } from 'react';

import { fetchWalkPhotos } from '@/lib/api/walkApi';
import { useFinishWalkStore, useWalkStore } from '@/stores/walkStore';
import type { WalkPhoto } from '@/types/domain';

function localPhotosFromUris(walkId: string, uris: string[]): WalkPhoto[] {
  return uris.map((uri, i) => ({
    id: `local-${walkId}-${i}`,
    walkId,
    imageUrl: uri,
    sortOrder: i,
  }));
}

export function useDiaryWalkPhotos(
  walkId: string | undefined,
  thumbnailUrl?: string | null,
): WalkPhoto[] {
  const photos = useWalkPhotos(walkId);

  if (photos.length > 0 || !walkId || !thumbnailUrl) {
    return photos;
  }

  return [
    {
      id: `thumb-${walkId}`,
      walkId,
      imageUrl: thumbnailUrl,
      sortOrder: 0,
    },
  ];
}

export function useWalkPhotos(walkId: string | undefined): WalkPhoto[] {
  const pending = useWalkStore((s) => (walkId ? s.pendingWalkPhotosByWalkId[walkId] : undefined));
  const photoUris = useFinishWalkStore((s) => s.form.photoUris);
  const [remotePhotosByWalkId, setRemotePhotosByWalkId] = useState<Record<string, WalkPhoto[]>>({});

  const localPhotos = useMemo(() => {
    if (!walkId) return [];
    return pending && pending.length > 0 ? pending : localPhotosFromUris(walkId, photoUris);
  }, [walkId, pending, photoUris]);

  useEffect(() => {
    if (!walkId) return;

    let cancelled = false;

    fetchWalkPhotos(walkId)
      .then((fetched) => {
        if (cancelled || fetched.length === 0) return;
        setRemotePhotosByWalkId((prev) => ({ ...prev, [walkId]: fetched }));
        useWalkStore.getState().clearPendingWalkPhotos(walkId);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [walkId]);

  if (!walkId) return [];

  const remotePhotos = remotePhotosByWalkId[walkId] ?? [];
  return remotePhotos.length > 0 ? remotePhotos : localPhotos;
}
