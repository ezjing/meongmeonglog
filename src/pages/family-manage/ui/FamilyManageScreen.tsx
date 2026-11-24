import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Clipboard, Platform, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { DogAvatar, formatWalkPartyName, useDogs } from '@/entities/dog';
import type { DogProfile } from '@/entities/dog';
import { useGuardianProfile } from '@/entities/guardian';
import {
  formatHouseholdTitle,
  formatInviteShareMessage,
  useCreateHouseholdInvite,
  useHouseholds,
  useLeaveHousehold,
  useRemoveHouseholdMember,
} from '@/entities/household';
import type { HouseholdGroup, HouseholdMember } from '@/entities/household';
import {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
} from '@/shared/config/theme';
import { useAuthStore } from '@/shared/session/sessionStore';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { BottomSheet, useOverlay } from '@/shared/ui/overlay';
import { StackAppBar } from '@/shared/ui/StackAppBar';

const MEMBER_PHOTO_SIZE = 40;
const DOG_AVATAR_SIZE = 36;
const CODE_LETTER_SPACING = 4;

function memberLabel(member: HouseholdMember): string {
  return member.guardianTitle?.trim() || '보호자';
}

async function copyCode(code: string) {
  if (Platform.OS === 'web') {
    await navigator.clipboard.writeText(code);
    return;
  }
  Clipboard.setString(code);
}

export function FamilyManageScreen() {
  const userId = useAuthStore((s) => s.userId);
  const { data: households, isLoading, isError, refetch } = useHouseholds();
  const { data: dogs = [] } = useDogs();
  const { data: guardian } = useGuardianProfile();
  const createInvite = useCreateHouseholdInvite();
  const removeMember = useRemoveHouseholdMember();
  const leaveHouse = useLeaveHousehold();
  const { showAlert, showToast } = useOverlay();
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const openInvite = async (householdId: string) => {
    try {
      const code = await createInvite.mutateAsync(householdId);
      setInviteCode(code);
    } catch {
      showToast({ message: '초대 코드를 만들지 못했어요', variant: 'error' });
    }
  };

  const handleCopy = async () => {
    if (!inviteCode) return;
    try {
      await copyCode(inviteCode);
      showToast({ message: '초대 코드를 복사했어요', variant: 'success' });
    } catch {
      // 복사 실패 문구는 승인된 표에 없다
    }
  };

  const handleShare = async () => {
    if (!inviteCode) return;
    const message = formatInviteShareMessage(guardian?.guardianTitle, inviteCode);
    try {
      await Share.share({ message });
    } catch {
      // 공유 시트를 닫은 경우는 실패로 보지 않는다
    }
  };

  const handleRemove = async (group: HouseholdGroup, member: HouseholdMember) => {
    const name = memberLabel(member);
    const confirmed = await showAlert({
      title: `${name}님을 내보낼까요?`,
      message: '이 집의 강아지와 일기를 더 볼 수 없어요. 남긴 산책 기록은 그대로 남아요.',
      cancelLabel: '취소',
      confirmLabel: '내보내기',
      destructive: true,
    });
    if (!confirmed) return;

    try {
      await removeMember.mutateAsync({ householdId: group.householdId, userId: member.userId });
    } catch {
      showToast({ message: '가족을 내보내지 못했어요', variant: 'error' });
    }
  };

  const handleLeave = async (group: HouseholdGroup) => {
    const confirmed = await showAlert({
      title: '이 집에서 나갈까요?',
      message: '이 집의 강아지와 일기를 더 볼 수 없어요. 내가 남긴 산책 기록은 그대로 남아요.',
      cancelLabel: '취소',
      confirmLabel: '나가기',
      destructive: true,
    });
    if (!confirmed) return;

    try {
      await leaveHouse.mutateAsync(group.householdId);
    } catch {
      showToast({ message: '집에서 나가지 못했어요', variant: 'error' });
    }
  };

  return (
    <View style={styles.screen}>
      <StackAppBar title="가족 관리" onBackPress={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? <Text style={styles.muted}>불러오는 중...</Text> : null}
        {isError ? (
          <View style={styles.errorBox}>
            <Text style={styles.muted}>가족 정보를 불러오지 못했어요</Text>
            <Button label="다시 시도" variant="secondary" onPress={() => refetch()} />
          </View>
        ) : null}
        {(households ?? []).map((group) => {
          const admin = group.members.find((member) => member.role === 'admin');
          const houseDogs = dogs
            .filter((dog) => dog.householdId === group.householdId)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          return (
            <Card key={group.householdId} style={styles.card}>
              <Text style={styles.houseTitle}>{formatHouseholdTitle(admin?.guardianTitle)}</Text>
              <HouseholdDogs dogs={houseDogs} />
              {group.members.map((member) => (
                <View key={member.userId} style={styles.memberRow}>
                  <MemberPhoto uri={member.profileImageUrl} />
                  <Text style={styles.memberName}>{memberLabel(member)}</Text>
                  {member.role === 'admin' ? <Text style={styles.badge}>관리자</Text> : null}
                  {group.myRole === 'admin' && member.userId !== userId ? (
                    <Button
                      label="내보내기"
                      variant="text"
                      onPress={() => handleRemove(group, member)}
                      loading={removeMember.isPending}
                    />
                  ) : null}
                </View>
              ))}
              {group.myRole === 'admin' ? (
                <Button
                  label="가족 초대하기"
                  variant="secondary"
                  onPress={() => openInvite(group.householdId)}
                  loading={createInvite.isPending}
                  style={styles.cardButton}
                />
              ) : (
                <Button
                  label="이 집에서 나가기"
                  variant="danger"
                  onPress={() => handleLeave(group)}
                  loading={leaveHouse.isPending}
                  style={styles.cardButton}
                />
              )}
            </Card>
          );
        })}
        <Button
          label="초대 코드 입력"
          variant="secondary"
          onPress={() => router.push('/family/join')}
        />
      </ScrollView>

      <BottomSheet
        visible={inviteCode != null}
        title="초대 코드"
        subtitle="가족에게 이 코드를 알려 주세요. 7일 동안 한 번만 쓸 수 있어요."
        onClose={() => setInviteCode(null)}
      >
        <Text style={styles.code}>{inviteCode}</Text>
        <Button label="코드 복사" onPress={handleCopy} />
        {Platform.OS === 'web' ? null : (
          <Button
            label="공유하기"
            variant="secondary"
            onPress={handleShare}
            style={styles.shareButton}
          />
        )}
      </BottomSheet>
    </View>
  );
}

function HouseholdDogs({ dogs }: { dogs: DogProfile[] }) {
  if (dogs.length === 0) return null;
  const names = formatWalkPartyName(dogs[0]?.name ?? '', Math.max(dogs.length - 1, 0));
  return (
    <View style={styles.dogs}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.dogRow}>
          {dogs.map((dog) => (
            <DogAvatar key={dog.dogId} imageUri={dog.profileImageUrl} size={DOG_AVATAR_SIZE} />
          ))}
        </View>
      </ScrollView>
      <Text style={styles.dogNames}>{names}</Text>
    </View>
  );
}

function MemberPhoto({ uri }: { uri: string | null }) {
  if (!uri) {
    return (
      <View style={styles.memberFallback}>
        <Text>🙂</Text>
      </View>
    );
  }
  return <Image source={{ uri }} style={styles.memberPhoto} contentFit="cover" />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  card: { gap: spacing.sm },
  houseTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.extrabold, color: colors.fg },
  dogs: { gap: spacing.xs },
  dogRow: { flexDirection: 'row', gap: spacing.sm },
  dogNames: { fontSize: fontSize.base, color: colors.fgSecondary },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  memberName: { flex: 1, fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.fg },
  badge: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.fgOnPrimary,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  memberPhoto: {
    width: MEMBER_PHOTO_SIZE,
    height: MEMBER_PHOTO_SIZE,
    borderRadius: MEMBER_PHOTO_SIZE / 2,
    backgroundColor: colors.surfaceMuted,
  },
  memberFallback: {
    width: MEMBER_PHOTO_SIZE,
    height: MEMBER_PHOTO_SIZE,
    borderRadius: MEMBER_PHOTO_SIZE / 2,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardButton: { marginTop: spacing.xs },
  muted: { color: colors.fgMuted, fontSize: fontSize.base },
  errorBox: { gap: spacing.sm },
  code: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.extrabold,
    color: colors.fg,
    textAlign: 'center',
    letterSpacing: CODE_LETTER_SPACING,
    marginBottom: spacing.md,
  },
  shareButton: { marginTop: spacing.sm },
});
