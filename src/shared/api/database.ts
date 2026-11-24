export type AuthProvider = 'kakao' | 'naver';

export type DogGender = 'MALE' | 'FEMALE';

export type DogMeetingLevel = 'NONE' | 'ONE_TO_TWO' | 'THREE_OR_MORE';

export interface UserRow {
  id: string;
  provider: AuthProvider;
  email: string | null;
  nickname: string | null;
  profile_image: string | null;
  guardian_title: string | null;
  parenting_style: string | null;
  current_concern: string | null;
  guardian_profile_image: string | null;
  created_at: string;
}

export interface DogRow {
  id: string;
  user_id: string | null;
  household_id: string;
  name: string;
  breed: string;
  birth_date: string;
  gender: DogGender;
  personality: string[];
  speech_style: string | null;
  custom_personality: string | null;
  custom_speech_style: string | null;
  profile_image_url: string | null;
  weight_kg: number | null;
  created_at: string;
}

export interface WalkRow {
  id: string;
  dog_id: string;
  recorded_by: string | null;
  started_at: string;
  ended_at: string | null;
  duration_sec: number | null;
  distance_meter: number | null;
  weather_condition: string | null;
  weather_temp: number | null;
  weather_icon: string | null;
  created_at: string;
}

export interface WalkPhotoRow {
  id: string;
  walk_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface DiaryRow {
  id: string;
  walk_id: string;
  dog_id: string;
  diary_content: string;
  daily_quote: string;
  ai_model: string | null;
  generated_at: string;
  created_at: string;
}
