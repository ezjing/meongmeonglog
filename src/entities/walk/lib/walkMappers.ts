import type { WalkRow } from '@/shared/api/database';

import type { WalkSession } from '../model/types';

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
