import type { DogMeetingLevel } from '@/shared/api/database';

export interface WalkSession {
  walkId: string;
  /** 산책을 시작한 대표 강아지 (walks.dog_id) */
  dogId: string;
  /** 함께 산책한 강아지. 첫 번째가 대표. 이전 저장분에는 없을 수 있다 */
  dogIds?: string[];
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

export interface WalkWeatherPayload {
  weatherCondition: string;
  weatherTemp: number;
  weatherIcon: string;
}
