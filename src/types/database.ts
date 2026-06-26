export type AuthProvider = 'kakao' | 'naver';

export type DogGender = 'MALE' | 'FEMALE';

export type DogMeetingLevel = 'NONE' | 'ONE_TO_TWO' | 'THREE_OR_MORE';

export interface UserRow {
  id: string;
  provider: AuthProvider;
  email: string | null;
  nickname: string | null;
  profile_image: string | null;
  created_at: string;
}

export interface DogRow {
  id: string;
  user_id: string;
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
  started_at: string;
  ended_at: string | null;
  duration_sec: number | null;
  distance_meter: number | null;
  weather_condition: string | null;
  weather_temp: number | null;
  weather_icon: string | null;
  created_at: string;
}

export interface WalkLocationRow {
  id: string;
  walk_id: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
}

export interface WalkEventRow {
  id: string;
  walk_id: string;
  pee_count: number;
  poop_count: number;
  dog_meeting_level: DogMeetingLevel;
  memo: string | null;
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

export interface ShareCardRow {
  id: string;
  diary_id: string;
  image_url: string;
  created_at: string;
}
