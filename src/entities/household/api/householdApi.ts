import { isSupabaseConfigured, supabase } from '@/shared/api/supabase';
import { AppError } from '@/shared/lib/AppError';

import { throwHouseholdRpcError } from '../lib/household';
import type { HouseholdGroup, HouseholdMember, InvitePreview } from '../model/types';

interface ProfileRow {
  household_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  guardian_title: string | null;
  guardian_profile_image: string | null;
}

function toMember(row: ProfileRow): HouseholdMember {
  return {
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at,
    guardianTitle: row.guardian_title,
    profileImageUrl: row.guardian_profile_image,
  };
}

function groupProfiles(rows: ProfileRow[], userId: string): HouseholdGroup[] {
  const byHousehold = new Map<string, ProfileRow[]>();
  for (const row of rows) {
    const list = byHousehold.get(row.household_id) ?? [];
    list.push(row);
    byHousehold.set(row.household_id, list);
  }

  const groups: HouseholdGroup[] = [];
  for (const [householdId, members] of byHousehold) {
    const mine = members.find((member) => member.user_id === userId);
    if (!mine) continue;
    groups.push({
      householdId,
      myRole: mine.role,
      myJoinedAt: mine.joined_at,
      members: members.map(toMember).sort((a, b) => a.joinedAt.localeCompare(b.joinedAt)),
    });
  }

  return groups.sort((a, b) => a.myJoinedAt.localeCompare(b.myJoinedAt));
}

export async function fetchHouseholds(userId: string): Promise<HouseholdGroup[]> {
  if (!isSupabaseConfigured) {
    return [
      {
        householdId: 'mock-household',
        myRole: 'admin',
        myJoinedAt: new Date(0).toISOString(),
        members: [
          {
            userId,
            role: 'admin',
            joinedAt: new Date(0).toISOString(),
            guardianTitle: null,
            profileImageUrl: null,
          },
        ],
      },
    ];
  }

  const { data, error } = await supabase
    .from('household_member_profiles')
    .select('household_id, user_id, role, joined_at, guardian_title, guardian_profile_image');

  if (error) throw new AppError('fetch_households_failed', error.message);
  return groupProfiles((data ?? []) as ProfileRow[], userId);
}

export async function createHouseholdInvite(householdId: string): Promise<string> {
  if (!isSupabaseConfigured) return 'ABCDEF';

  const { data, error } = await supabase.rpc('create_household_invite', {
    target_household_id: householdId,
  });
  if (error) throwHouseholdRpcError(error, 'invite_create_failed');
  if (typeof data !== 'string' || data.length === 0) {
    throw new AppError('invite_create_failed', 'empty invite code');
  }
  return data;
}

export async function previewHouseholdInvite(code: string): Promise<InvitePreview> {
  if (!isSupabaseConfigured) {
    return { householdId: 'mock-household', inviterTitle: '엄마', dogs: [] };
  }

  const { data, error } = await supabase.rpc('preview_household_invite', { raw_code: code });
  if (error) throwHouseholdRpcError(error, 'invite_invalid');

  const row = data as {
    error?: string;
    householdId?: string;
    inviterTitle?: string | null;
    dogs?: { name?: string; profileImageUrl?: string | null; createdAt?: string }[];
  } | null;
  if (row?.error) throw new AppError(row.error, row.error);

  return {
    householdId: row?.householdId ?? '',
    inviterTitle: row?.inviterTitle ?? null,
    dogs: (row?.dogs ?? []).map((dog) => ({
      name: dog.name ?? '',
      profileImageUrl: dog.profileImageUrl ?? null,
      createdAt: dog.createdAt ?? '',
    })),
  };
}

export async function acceptHouseholdInvite(code: string): Promise<string> {
  if (!isSupabaseConfigured) return 'mock-household';

  const { data, error } = await supabase.rpc('accept_household_invite', { raw_code: code });
  if (error) throwHouseholdRpcError(error, 'invite_invalid');
  const row = data as { error?: string; householdId?: string } | null;
  if (row?.error) throw new AppError(row.error, row.error);
  if (!row?.householdId) throw new AppError('invite_invalid', 'empty household');
  return row.householdId;
}

export async function removeHouseholdMember(householdId: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase.rpc('remove_household_member', {
    target_household_id: householdId,
    target_user_id: userId,
  });
  if (error) throw new AppError('remove_member_failed', error.message);
}

export async function leaveHousehold(householdId: string): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase.rpc('leave_household', {
    target_household_id: householdId,
  });
  if (error) throw new AppError('leave_household_failed', error.message);
}
