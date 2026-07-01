import type { AuthProvider, DogGender, DogMeetingLevel } from "./database";

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

export interface Diary {
  diaryId: string;
  walkId: string;
  dogId: string;
  content: string;
  dailyQuote: string;
  aiModel: string | null;
  generatedAt: string;
  createdAt: string;
}

export interface DiaryListItem extends Diary {
  dogName?: string;
  distanceMeter?: number | null;
  durationSec?: number | null;
  thumbnailUrl?: string | null;
}

export interface CalendarDay {
  date: string;
  hasDiary: boolean;
}

export interface AuthSession {
  userId: string;
  accessToken: string;
  provider: AuthProvider;
}

export interface GuardianProfile {
  guardianTitle: string | null;
  parentingStyle: string | null;
  currentConcern: string | null;
  guardianProfileImageUrl: string | null;
}

export interface UpdateGuardianProfileInput {
  guardianTitle: string;
  parentingStyle?: string;
  currentConcern?: string;
  profileImageUri?: string;
  guardianProfileImageUrl?: string | null;
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
