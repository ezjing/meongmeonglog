import type { UserRow } from '@/shared/api/database';
import { uploadStorageImage } from '@/shared/api/storageUpload';
import { isSupabaseConfigured, supabase } from '@/shared/api/supabase';
import { AppError } from '@/shared/lib/AppError';

import type { GuardianProfile, UpdateGuardianProfileInput } from '../model/types';

const mockProfiles = new Map<string, GuardianProfile>();

function toGuardianProfile(
  row: Pick<
    UserRow,
    'guardian_title' | 'parenting_style' | 'current_concern' | 'guardian_profile_image'
  >,
): GuardianProfile {
  return {
    guardianTitle: row.guardian_title,
    parentingStyle: row.parenting_style,
    currentConcern: row.current_concern,
    guardianProfileImageUrl: row.guardian_profile_image,
  };
}

const EMPTY_GUARDIAN_PROFILE: GuardianProfile = {
  guardianTitle: null,
  parentingStyle: null,
  currentConcern: null,
  guardianProfileImageUrl: null,
};

export function isGuardianProfileComplete(profile: GuardianProfile): boolean {
  return !!profile.guardianTitle?.trim();
}

export async function fetchGuardianProfile(userId: string): Promise<GuardianProfile> {
  if (!isSupabaseConfigured) {
    return mockProfiles.get(userId) ?? EMPTY_GUARDIAN_PROFILE;
  }

  const { data, error } = await supabase
    .from('users')
    .select('guardian_title, parenting_style, current_concern, guardian_profile_image')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new AppError('fetch_guardian_profile_failed', error.message);
  if (!data) {
    return EMPTY_GUARDIAN_PROFILE;
  }

  return toGuardianProfile(data as UserRow);
}

async function uploadGuardianProfileImage(userId: string, uri: string): Promise<string> {
  const path = `${userId}/guardian-${Date.now()}.jpg`;
  return uploadStorageImage('dog-profiles', path, uri);
}

export async function updateGuardianProfile(
  userId: string,
  input: UpdateGuardianProfileInput,
): Promise<GuardianProfile> {
  // 사진은 바꿀 때만 갱신한다 (기존 값을 알기 위한 사전 조회 없이)
  let guardianProfileImageUrl = input.guardianProfileImageUrl;
  if (input.profileImageUri) {
    guardianProfileImageUrl = await uploadGuardianProfileImage(userId, input.profileImageUri);
  }

  const fields = {
    guardianTitle: input.guardianTitle.trim(),
    parentingStyle: input.parentingStyle?.trim() || null,
    currentConcern: input.currentConcern?.trim() || null,
  };

  if (!isSupabaseConfigured) {
    const profile: GuardianProfile = {
      ...fields,
      guardianProfileImageUrl:
        guardianProfileImageUrl !== undefined
          ? guardianProfileImageUrl
          : (mockProfiles.get(userId)?.guardianProfileImageUrl ?? null),
    };
    mockProfiles.set(userId, profile);
    return profile;
  }

  const { data, error } = await supabase
    .from('users')
    .update({
      guardian_title: fields.guardianTitle,
      parenting_style: fields.parentingStyle,
      current_concern: fields.currentConcern,
      ...(guardianProfileImageUrl !== undefined
        ? { guardian_profile_image: guardianProfileImageUrl }
        : {}),
    })
    .eq('id', userId)
    .select('guardian_title, parenting_style, current_concern, guardian_profile_image')
    .single();

  if (error) throw new AppError('update_guardian_profile_failed', error.message);
  return toGuardianProfile(data as UserRow);
}
