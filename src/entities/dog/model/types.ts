import type { DogGender } from '@/shared/api/database';

export interface DogProfile {
  dogId: string;
  userId: string;
  name: string;
  breed: string;
  birthDate: string;
  gender: DogGender;
  personality: string[];
  speechStyle: string | null;
  customPersonality: string | null;
  customSpeechStyle: string | null;
  profileImageUrl: string | null;
  weightKg: number | null;
  createdAt: string;
}

export interface CreateDogInput {
  name: string;
  breed: string;
  birthDate: string;
  gender: DogGender;
  personality: string[];
  speechStyle?: string;
  customPersonality?: string;
  customSpeechStyle?: string;
  profileImageUrl?: string;
  weightKg?: number | null;
}
