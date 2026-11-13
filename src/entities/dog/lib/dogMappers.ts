import type { DogRow } from '@/shared/api/database';

import type { DogProfile } from '../model/types';

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
