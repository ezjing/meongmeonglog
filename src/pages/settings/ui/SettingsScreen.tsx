import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { formatWalkPartyName, useDogs, useSelectedDog } from '@/entities/dog';
import { useGuardianProfile } from '@/entities/guardian';
import { formatHouseholdTitle, isHouseholdAdmin, useHouseholds } from '@/entities/household';
import type { HouseholdGroup } from '@/entities/household';
import { PROVIDER_LABEL, useAccountEmail, useAuthSession, useConfirmLogout } from '@/features/auth';
import { SettingsDrawer } from '@/features/settings';
import { colors, spacing, fontSize, fontWeight, lineHeight } from '@/shared/config/theme';
import { openDogEdit, openGuardianEdit } from '@/shared/lib/navigation';
import { useLocationPermissionCheck } from '@/shared/lib/useLocationPermissionCheck';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { BottomSheet, useOverlay } from '@/shared/ui/overlay';
import { TabAppBar } from '@/shared/ui/TabAppBar';

export function SettingsScreen() {
  const { userId, provider, deleteAccount, isDeletingAccount } = useAuthSession();
  const confirmLogout = useConfirmLogout();
  const checkLocationPermission = useLocationPermissionCheck();
  const { data: accountEmail } = useAccountEmail();
  const { dog } = useSelectedDog();
  const { data: dogs = [] } = useDogs();
  const { data: households, isLoading: isHouseholdLoading, isError: isHouseholdError } =
    useHouseholds();
  const { showAlert, showToast } = useOverlay();
  const { data: guardianProfile } = useGuardianProfile();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [pickIndex, setPickIndex] = useState<number | null>(null);
  const [pickedSuccessor, setPickedSuccessor] = useState<Record<string, string>>({});
  const guardianTitle = guardianProfile?.guardianTitle?.trim();

  const housesNeedingSuccessor = (households ?? []).filter(
    (group) => group.myRole === 'admin' && group.members.some((member) => member.userId !== userId),
  );
  const pickingHouse = pickIndex != null ? housesNeedingSuccessor[pickIndex] : null;

  const confirmDelete = async (
    pickedNewAdmin: boolean,
    successors: { householdId: string; userId: string }[],
  ) => {
    const groups = households ?? [];
    const hasSharedHouse = groups.some((group) =>
      group.members.some((member) => member.userId !== userId),
    );
    const hasSoloHouse = groups.some(
      (group) =>
        group.members.length > 0 && group.members.every((member) => member.userId === userId),
    );
    const message = [
      pickedNewAdmin ? '선택한 가족이 그 집의 강아지를 맡아요.' : null,
      hasSharedHouse ? '가족과 함께 쓰는 집에 남긴 기록은 그대로 남아요.' : null,
      hasSoloHouse ? '혼자 쓰는 집의 강아지와 기록은 모두 삭제돼요.' : null,
      '계정과 개인정보는 삭제되어 되돌릴 수 없어요.',
    ]
      .filter((part): part is string => part != null)
      .join(' ');
    const confirmed = await showAlert({
      icon: '⚠️',
      title: '정말 탈퇴하시겠어요?',
      message,
      cancelLabel: '취소',
      confirmLabel: '탈퇴하기',
      destructive: true,
    });
    if (!confirmed) return;

    try {
      await deleteAccount(successors);
      router.replace('/(auth)/login');
    } catch {
      showToast({ message: '계정 삭제에 실패했어요. 다시 시도해주세요.', variant: 'error' });
    }
  };

  const handleDeleteAccount = () => {
    if (isHouseholdLoading) return;
    if (isHouseholdError || !households) {
      showToast({ message: '가족 정보를 불러오지 못했어요', variant: 'error' });
      return;
    }
    if (housesNeedingSuccessor.length === 0) {
      void confirmDelete(false, []);
      return;
    }
    setPickedSuccessor({});
    setPickIndex(0);
  };

  const handleSuccessorNext = () => {
    if (pickingHouse == null || pickIndex == null) return;
    const successorId = pickedSuccessor[pickingHouse.householdId];
    if (!successorId) return;
    if (pickIndex < housesNeedingSuccessor.length - 1) {
      setPickIndex(pickIndex + 1);
      return;
    }
    const successors = housesNeedingSuccessor.map((group) => ({
      householdId: group.householdId,
      userId: pickedSuccessor[group.householdId] ?? '',
    }));
    setPickIndex(null);
    void confirmDelete(true, successors);
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TabAppBar title="설정" onMenuPress={() => setDrawerVisible(true)} />

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>보호자 정보</Text>
          {guardianTitle ? (
            <>
              <Text style={styles.row}>호칭: {guardianTitle}</Text>
              {guardianProfile?.parentingStyle ? (
                <Text style={styles.row}>양육 스타일: {guardianProfile.parentingStyle}</Text>
              ) : null}
              {guardianProfile?.currentConcern ? (
                <Text style={styles.row}>현재 고민: {guardianProfile.currentConcern}</Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.row}>등록된 보호자 정보가 없어요</Text>
          )}
          <Button
            label="보호자 정보 수정"
            variant="secondary"
            onPress={openGuardianEdit}
            style={styles.btn}
          />
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>강아지 정보</Text>
          {dog ? (
            <>
              <Text style={styles.row}>
                {dog.name} · {dog.breed}
              </Text>
              <Button
                label="강아지 정보 수정"
                variant="secondary"
                onPress={() => {
                  if (households && !isHouseholdAdmin(households, dog.householdId)) {
                    showToast({
                      message: '강아지 정보는 집 관리자만 바꿀 수 있어요',
                      variant: 'warning',
                    });
                    return;
                  }
                  openDogEdit(dog.dogId);
                }}
                style={styles.btn}
              />
            </>
          ) : (
            <Text style={styles.row}>등록된 강아지가 없습니다</Text>
          )}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>로그인 계정</Text>
          <Text style={styles.row}>
            {provider ? PROVIDER_LABEL[provider] : '-'}
            {accountEmail ? ` · ${accountEmail}` : ''}
          </Text>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>앱 권한</Text>
          <Button label="위치 권한 확인" variant="secondary" onPress={checkLocationPermission} />
          <Text style={styles.hint}>산책 기록을 위해 위치·카메라(사진) 권한이 필요합니다.</Text>
        </Card>

        <Button
          label="로그아웃"
          variant="secondary"
          onPress={confirmLogout}
          style={styles.logout}
        />
        <Button
          label="회원 탈퇴"
          variant="danger"
          onPress={handleDeleteAccount}
          loading={isDeletingAccount}
          style={styles.deleteAccount}
        />
      </ScrollView>

      <SettingsDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onLogout={confirmLogout}
      />
      <SuccessorPickSheet
        house={pickingHouse}
        dogs={dogs}
        userId={userId}
        selectedUserId={pickingHouse ? pickedSuccessor[pickingHouse.householdId] : undefined}
        onSelect={(memberId) => {
          if (!pickingHouse) return;
          setPickedSuccessor((current) => ({ ...current, [pickingHouse.householdId]: memberId }));
        }}
        onNext={handleSuccessorNext}
        onClose={() => setPickIndex(null)}
      />
    </>
  );
}

function SuccessorPickSheet({
  house,
  dogs,
  userId,
  selectedUserId,
  onSelect,
  onNext,
  onClose,
}: {
  house: HouseholdGroup | null;
  dogs: { householdId: string; name: string; createdAt: string }[];
  userId: string | null;
  selectedUserId?: string;
  onSelect: (userId: string) => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const admin = house?.members.find((member) => member.role === 'admin');
  const houseDogs = dogs
    .filter((dog) => dog.householdId === house?.householdId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const candidates = house?.members.filter((member) => member.userId !== userId) ?? [];

  return (
    <BottomSheet
      visible={house != null}
      title="강아지를 맡을 가족을 골라 주세요"
      subtitle={house ? formatHouseholdTitle(admin?.guardianTitle) : undefined}
      onClose={onClose}
    >
      {houseDogs.length > 0 ? (
        <Text style={styles.successorDogs}>
          {formatWalkPartyName(houseDogs[0]?.name ?? '', Math.max(houseDogs.length - 1, 0))}
        </Text>
      ) : null}
      {candidates.map((member) => {
        const selected = member.userId === selectedUserId;
        const label = member.guardianTitle?.trim() || '보호자';
        return (
          <Pressable
            key={member.userId}
            style={styles.successorRow}
            onPress={() => onSelect(member.userId)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
          >
            <Text style={styles.successorName}>{label}</Text>
            <Text style={selected ? styles.successorOn : styles.successorOff}>{selected ? '✓' : ''}</Text>
          </Pressable>
        );
      })}
      <Button label="다음" onPress={onNext} disabled={!selectedUserId} style={styles.successorNext} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  section: { marginBottom: spacing.md },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.fg,
    marginBottom: spacing.sm,
  },
  row: { fontSize: fontSize.base, color: colors.fgSecondary, marginBottom: spacing.sm },
  btn: { marginTop: spacing.xs },
  hint: {
    fontSize: fontSize.sm,
    color: colors.fgMuted,
    marginTop: spacing.sm,
    lineHeight: lineHeight.sm,
  },
  logout: { marginTop: spacing.lg },
  deleteAccount: { marginTop: spacing.sm },
  successorDogs: { fontSize: fontSize.base, color: colors.fgSecondary, marginBottom: spacing.sm },
  successorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  successorName: { flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.fg },
  successorOff: { width: spacing.lg, color: colors.fgMuted },
  successorOn: { width: spacing.lg, color: colors.primaryFg, fontSize: fontSize.lg },
  successorNext: { marginTop: spacing.md },
});
