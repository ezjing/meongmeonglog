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
