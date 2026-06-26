import type { DogRow, WalkRow } from '@/types/database';
import type { DogProfile, WalkSession } from '@/types/domain';

export function toDogProfile(row: DogRow): DogProfile {
  return {
    dogId: row.id,
    userId: row.user_id,
    name: row.name,
    breed: row.breed,
    birthDate: row.birth_date,
    gender: row.gender,
    personality: row.personality ?? [],
    speechStyle: row.speech_style,
    customPersonality: row.custom_personality,
    customSpeechStyle: row.custom_speech_style,
    profileImageUrl: row.profile_image_url,
    weightKg: row.weight_kg,
    createdAt: row.created_at,
  };
}

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
