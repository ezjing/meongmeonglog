import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { SettingsDrawer } from '@/components/settings/SettingsDrawer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useOverlay } from '@/components/ui/overlay';
import { TabAppBar } from '@/components/ui/TabAppBar';
import { colors, spacing } from '@/constants/theme';
import { useAuthSession, useDogs } from '@/hooks/useAuthSession';
import { useGuardianProfile } from '@/hooks/useGuardianProfile';
import { requestLocationPermission } from '@/hooks/useWalkTracker';

export default function SettingsScreen() {
  const { logout } = useAuthSession();
  const { data: dogs } = useDogs();
  const { showAlert, showToast } = useOverlay();
  const { data: guardianProfile } = useGuardianProfile();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const dog = dogs?.[0];
  const guardianTitle = guardianProfile?.guardianTitle?.trim();

  const handleLogout = async () => {
    const confirmed = await showAlert({
      icon: '🚪',
      title: '로그아웃할까요?',
      message: '다시 로그인하면 이어서 이용할 수 있어요.',
      cancelLabel: '취소',
      confirmLabel: '로그아웃',
      destructive: true,
    });
    if (!confirmed) return;
    await logout();
    router.replace('/(auth)/login');
  };

  const handleLocationPermission = async () => {
    const granted = await requestLocationPermission();
    showToast({
      message: granted ? '📍 위치 권한이 허용되었어요' : '⚠️ 설정에서 위치 권한을 허용해주세요',
      variant: granted ? 'success' : 'warning',
    });
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
            onPress={() =>
              router.push({
                pathname: '/(onboarding)/guardianBasic',
                params: { mode: 'edit' },
              })
            }
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
                onPress={() =>
                  router.push({
                    pathname: '/(onboarding)/dogBasic',
                    params: { mode: 'edit' },
                  })
                }
                style={styles.btn}
              />
            </>
          ) : (
            <Text style={styles.row}>등록된 강아지가 없습니다</Text>
          )}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>앱 권한</Text>
          <Button label="위치 권한 확인" variant="outline" onPress={handleLocationPermission} />
          <Text style={styles.hint}>산책 기록을 위해 위치·카메라(사진) 권한이 필요합니다.</Text>
        </Card>

        <Button label="로그아웃" variant="outline" onPress={handleLogout} style={styles.logout} />
      </ScrollView>

      <SettingsDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  section: { marginBottom: spacing.md },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  row: { fontSize: 14, color: '#5b5b66', marginBottom: spacing.sm },
  btn: { marginTop: spacing.xs },
  hint: {
    fontSize: 11,
    color: colors.grey,
    marginTop: spacing.sm,
    lineHeight: 16,
  },
  logout: { marginTop: spacing.lg },
});
