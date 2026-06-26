import { AppError } from '@/lib/AppError';
import { toDogProfile } from '@/lib/mappers/walkMappers';
import { uploadStorageImage } from '@/lib/storageUpload';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { DogRow } from '@/types/database';
import type { CreateDogInput, DogProfile } from '@/types/domain';

const mockDogs: DogProfile[] = [];

export async function fetchDogs(userId: string): Promise<DogProfile[]> {
  if (!isSupabaseConfigured) {
    return mockDogs.filter((d) => d.userId === userId);
  }

  const { data, error } = await supabase
    .from('dogs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new AppError('fetch_dogs_failed', error.message);
  return (data as DogRow[]).map(toDogProfile);
}

export async function createDog(userId: string, input: CreateDogInput): Promise<DogProfile> {
  if (!isSupabaseConfigured) {
    const dog: DogProfile = {
      dogId: `dog-${Date.now()}`,
      userId,
      name: input.name,
      breed: input.breed,
      birthDate: input.birthDate,
      gender: input.gender,
      personality: input.personality,
      speechStyle: input.speechStyle ?? null,
      customPersonality: input.customPersonality ?? null,
      customSpeechStyle: input.customSpeechStyle ?? null,
      profileImageUrl: input.profileImageUrl ?? null,
      weightKg: input.weightKg ?? null,
      createdAt: new Date().toISOString(),
    };
    mockDogs.push(dog);
    return dog;
  }

  const { data, error } = await supabase
    .from('dogs')
    .insert({
      user_id: userId,
      name: input.name,
      breed: input.breed,
      birth_date: input.birthDate,
      gender: input.gender,
      personality: input.personality,
      speech_style: input.speechStyle ?? null,
      custom_personality: input.customPersonality ?? null,
      custom_speech_style: input.customSpeechStyle ?? null,
      profile_image_url: input.profileImageUrl ?? null,
      weight_kg: input.weightKg ?? null,
    })
    .select()
    .single();

  if (error) throw new AppError('create_dog_failed', error.message);
  return toDogProfile(data as DogRow);
}

export async function updateDog(
  dogId: string,
  input: Partial<CreateDogInput>,
): Promise<DogProfile> {
  if (!isSupabaseConfigured) {
    const idx = mockDogs.findIndex((d) => d.dogId === dogId);
    if (idx === -1) throw new AppError('dog_not_found', '강아지를 찾을 수 없습니다.');
    mockDogs[idx] = { ...mockDogs[idx], ...input, speechStyle: input.speechStyle ?? mockDogs[idx].speechStyle };
    return mockDogs[idx];
  }

  const { data, error } = await supabase
    .from('dogs')
    .update({
      name: input.name,
      breed: input.breed,
      birth_date: input.birthDate,
      gender: input.gender,
      personality: input.personality,
      speech_style: input.speechStyle,
      custom_personality: input.customPersonality,
      custom_speech_style: input.customSpeechStyle,
      profile_image_url: input.profileImageUrl,
      weight_kg: input.weightKg,
    })
    .eq('id', dogId)
    .select()
    .single();

  if (error) throw new AppError('update_dog_failed', error.message);
  return toDogProfile(data as DogRow);
}

export async function uploadDogProfileImage(userId: string, uri: string): Promise<string> {
  const { data: authData } = await supabase.auth.getUser();
  const authUserId = authData.user?.id;

  if (authUserId && authUserId !== userId) {
    throw new AppError('storage_user_mismatch', '로그인 사용자와 업로드 경로가 일치하지 않습니다.');
  }

  const ownerId = authUserId ?? userId;
  const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
  const path = `${ownerId}/profile-${Date.now()}.${ext}`;

  return uploadStorageImage('dog-profiles', path, uri);
}
