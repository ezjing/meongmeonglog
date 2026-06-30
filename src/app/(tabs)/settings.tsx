import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SettingsDrawer } from '@/components/settings/SettingsDrawer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useOverlay } from '@/components/ui/overlay';
import { useAuthSession, useDogs, useUpdateDog } from '@/hooks/useAuthSession';
import { requestLocationPermission } from '@/hooks/useWalkTracker';
import { colors, spacing } from '@/constants/theme';

export default function SettingsScreen() {
  const { logout } = useAuthSession();
  const { data: dogs } = useDogs();
  const updateDog = useUpdateDog();
  const { showAlert, showToast } = useOverlay();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const dog = dogs?.[0];

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
        <View style={styles.headRow}>
          <Text style={styles.title}>설정</Text>
          <Pressable style={styles.menuBtn} onPress={() => setDrawerVisible(true)}>
            <Text style={styles.menuBtnText}>☰</Text>
          </Pressable>
        </View>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>내 강아지</Text>
          {dog ? (
            <>
              <Text style={styles.row}>{dog.name} · {dog.breed}</Text>
              <Button
                label="프로필 수정 (이름)"
                variant="soft"
                onPress={() =>
                  updateDog.mutate({
                    dogId: dog.dogId,
                    input: { name: dog.name },
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
          <Text style={styles.hint}>
            산책 기록을 위해 위치·카메라(사진) 권한이 필요합니다.
          </Text>
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
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtnText: { fontSize: 16, color: colors.ink },
  section: { marginBottom: spacing.md },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.ink, marginBottom: spacing.sm },
  row: { fontSize: 14, color: '#5b5b66', marginBottom: spacing.sm },
  btn: { marginTop: spacing.xs },
  hint: { fontSize: 11, color: colors.grey, marginTop: spacing.sm, lineHeight: 16 },
  logout: { marginTop: spacing.lg },
});
