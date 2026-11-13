import type { DogMeetingLevel } from '@/shared/api/database';

export interface WalkSession {
  walkId: string;
  dogId: string;
  startedAt: string;
  endedAt: string | null;
  durationSec: number | null;
  distanceMeter: number | null;
  weatherCondition: string | null;
  weatherTemp: number | null;
  weatherIcon: string | null;
}

export interface WalkEvent {
  peeCount: number;
  poopCount: number;
  dogMeetingLevel: DogMeetingLevel;
  memo: string | null;
}

export interface WalkPhoto {
  id: string;
  walkId: string;
  imageUrl: string;
  sortOrder: number;
}
