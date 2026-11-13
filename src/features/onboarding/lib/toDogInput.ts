import type { CreateDogInput } from '@/entities/dog';

import type { OnboardingForm } from '../model/onboardingStore';

function parseWeightKg(value: string): number | null {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

/** 온보딩 입력값을 강아지 등록·수정 API 입력으로 바꾼다 */
export function toDogInput(form: OnboardingForm, profileImageUrl?: string): CreateDogInput {
  return {
    name: form.name,
    breed: form.breed,
    birthDate: form.birthDate,
    gender: form.gender,
    personality: form.personality,
    speechStyle: form.speechStyle,
    customPersonality: form.customPersonality.trim(),
    customSpeechStyle: form.customSpeechStyle.trim(),
    weightKg: parseWeightKg(form.weightKg),
    profileImageUrl,
  };
}
