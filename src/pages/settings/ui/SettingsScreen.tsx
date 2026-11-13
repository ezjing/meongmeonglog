import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { useDogs } from '@/entities/dog';
import { useGuardianProfile } from '@/entities/guardian';
import { PROVIDER_LABEL, useAccountEmail, useAuthSession, useConfirmLogout } from '@/features/auth';
import { SettingsDrawer } from '@/features/settings';
import { colors, spacing, fontSize, fontWeight, lineHeight } from '@/shared/config/theme';
import { openDogEdit, openGuardianEdit } from '@/shared/lib/navigation';
import { useLocationPermissionCheck } from '@/shared/lib/useLocationPermissionCheck';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { useOverlay } from '@/shared/ui/overlay/index';
import { TabAppBar } from '@/shared/ui/TabAppBar';

export function SettingsScreen() {
  const { provider, deleteAccount, isDeletingAccount } = useAuthSession();
  const confirmLogout = useConfirmLogout();
  const checkLocationPermission = useLocationPermissionCheck();
  const { data: accountEmail } = useAccountEmail();
  const { data: dogs } = useDogs();
  const { showAlert, showToast } = useOverlay();
  const { data: guardianProfile } = useGuardianProfile();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const dog = dogs?.[0];
  const guardianTitle = guardianProfile?.guardianTitle?.trim();

  const handleDeleteAccount = async () => {
    const confirmed = await showAlert({
      icon: '⚠️',
      title: '정말 탈퇴하시겠어요?',
      message:
        '반려견 정보, 산책 기록, 사진, 다이어리 등 모든 데이터가 영구적으로 삭제되며 되돌릴 수 없어요.',
      cancelLabel: '취소',
      confirmLabel: '탈퇴하기',
      destructive: true,
    });
    if (!confirmed) return;

    try {
      await deleteAccount();
      router.replace('/(auth)/login');
    } catch {
      showToast({ message: '⚠️ 계정 삭제에 실패했어요. 다시 시도해주세요.', variant: 'warning' });
    }
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
            variant="soft"
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
                variant="soft"
                onPress={openDogEdit}
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
          <Button label="위치 권한 확인" variant="outline" onPress={checkLocationPermission} />
          <Text style={styles.hint}>산책 기록을 위해 위치·카메라(사진) 권한이 필요합니다.</Text>
        </Card>

        <Button label="로그아웃" variant="outline" onPress={confirmLogout} style={styles.logout} />
        <Button
          label="회원 탈퇴"
          variant="outline"
          onPress={handleDeleteAccount}
          disabled={isDeletingAccount}
          style={styles.deleteAccount}
        />
      </ScrollView>

      <SettingsDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onLogout={confirmLogout}
      />
    </>
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
  deleteAccount: { marginTop: spacing.sm, borderColor: colors.danger },
});
