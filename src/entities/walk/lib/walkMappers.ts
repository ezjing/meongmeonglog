import type { WalkPhotoRow, WalkRow } from '@/shared/api/database';

import type { WalkPhoto, WalkSession } from '../model/types';

export function toWalkSession(row: WalkRow): WalkSession {
  return {
    walkId: row.id,
    dogId: row.dog_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationSec: row.duration_sec,
    distanceMeter: row.distance_meter,
    weatherCondition: row.weather_condition,
    weatherTemp: row.weather_temp,
    weatherIcon: row.weather_icon,
  };
}

export function toWalkPhoto(
  row: Pick<WalkPhotoRow, 'id' | 'walk_id' | 'image_url' | 'sort_order'>,
): WalkPhoto {
  return {
    id: row.id,
    walkId: row.walk_id,
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
  };
}
