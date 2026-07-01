import { AppError } from "@/lib/AppError";
import { uploadStorageImage } from "@/lib/storageUpload";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { UserRow } from "@/types/database";
import type { GuardianProfile, UpdateGuardianProfileInput } from "@/types/domain";

const mockProfiles = new Map<string, GuardianProfile>();

function toGuardianProfile(row: Pick<
  UserRow,
  | "guardian_title"
  | "parenting_style"
  | "current_concern"
  | "guardian_profile_image"
>): GuardianProfile {
  return {
    guardianTitle: row.guardian_title,
    parentingStyle: row.parenting_style,
    currentConcern: row.current_concern,
    guardianProfileImageUrl: row.guardian_profile_image,
  };
}

export function isGuardianProfileComplete(profile: GuardianProfile): boolean {
  return !!profile.guardianTitle?.trim();
}

export async function fetchGuardianProfile(
  userId: string,
): Promise<GuardianProfile> {
  if (!isSupabaseConfigured) {
    return (
      mockProfiles.get(userId) ?? {
        guardianTitle: null,
        parentingStyle: null,
        currentConcern: null,
        guardianProfileImageUrl: null,
      }
    );
  }

  const { data, error } = await supabase
    .from("users")
    .select(
      "guardian_title, parenting_style, current_concern, guardian_profile_image",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new AppError("fetch_guardian_profile_failed", error.message);
  if (!data) {
    return {
      guardianTitle: null,
      parentingStyle: null,
      currentConcern: null,
      guardianProfileImageUrl: null,
    };
  }

  return toGuardianProfile(data as UserRow);
}

export async function uploadGuardianProfileImage(
  userId: string,
  uri: string,
): Promise<string> {
  const path = `${userId}/guardian-${Date.now()}.jpg`;
  return uploadStorageImage("dog-profiles", path, uri);
}

export async function updateGuardianProfile(
  userId: string,
  input: UpdateGuardianProfileInput,
): Promise<GuardianProfile> {
  const existing = await fetchGuardianProfile(userId);

  let guardianProfileImageUrl =
    input.guardianProfileImageUrl !== undefined
      ? input.guardianProfileImageUrl
      : existing.guardianProfileImageUrl;

  if (input.profileImageUri) {
    guardianProfileImageUrl = await uploadGuardianProfileImage(
      userId,
      input.profileImageUri,
    );
  }

  const profile: GuardianProfile = {
    guardianTitle: input.guardianTitle.trim(),
    parentingStyle: input.parentingStyle?.trim() || null,
    currentConcern: input.currentConcern?.trim() || null,
    guardianProfileImageUrl,
  };

  if (!isSupabaseConfigured) {
    mockProfiles.set(userId, profile);
    return profile;
  }

  const { data, error } = await supabase
    .from("users")
    .update({
      guardian_title: profile.guardianTitle,
      parenting_style: profile.parentingStyle,
      current_concern: profile.currentConcern,
      guardian_profile_image: profile.guardianProfileImageUrl,
    })
    .eq("id", userId)
    .select(
      "guardian_title, parenting_style, current_concern, guardian_profile_image",
    )
    .single();

  if (error) throw new AppError("update_guardian_profile_failed", error.message);
  return toGuardianProfile(data as UserRow);
}
