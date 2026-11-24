export interface HouseholdMember {
  userId: string;
  role: 'admin' | 'member';
  joinedAt: string;
  guardianTitle: string | null;
  profileImageUrl: string | null;
}

export interface HouseholdGroup {
  householdId: string;
  myRole: 'admin' | 'member';
  myJoinedAt: string;
  members: HouseholdMember[];
}

export interface InvitePreviewDog {
  name: string;
  profileImageUrl: string | null;
  createdAt: string;
}

export interface InvitePreview {
  householdId: string;
  inviterTitle: string | null;
  dogs: InvitePreviewDog[];
}
