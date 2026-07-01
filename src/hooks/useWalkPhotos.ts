import { useEffect, useState } from 'react';

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
  const pending = useWalkStore((s) =>
    walkId ? s.pendingWalkPhotosByWalkId[walkId] : undefined,
  );
  const photoUris = useFinishWalkStore((s) => s.form.photoUris);
  const [photos, setPhotos] = useState<WalkPhoto[]>([]);

  useEffect(() => {
    if (!walkId) {
      setPhotos([]);
      return;
    }

    const localPhotos =
      pending && pending.length > 0
        ? pending
        : localPhotosFromUris(walkId, photoUris);

    if (localPhotos.length > 0) {
      setPhotos(localPhotos);
    }

    fetchWalkPhotos(walkId)
      .then((fetched) => {
        if (fetched.length > 0) {
          setPhotos(fetched);
          useWalkStore.getState().clearPendingWalkPhotos(walkId);
        }
      })
      .catch(() => {});
  }, [walkId, pending, photoUris]);

  return photos;
}
