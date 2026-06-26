import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthSession, useDogs, useUpdateDog } from '@/hooks/useAuthSession';
import { requestLocationPermission } from '@/hooks/useWalkTracker';
import { colors, spacing } from '@/constants/theme';

export default function SettingsScreen() {
  const { logout } = useAuthSession();
  const { data: dogs } = useDogs();
  const updateDog = useUpdateDog();
  const dog = dogs?.[0];

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleLocationPermission = async () => {
    const granted = await requestLocationPermission();
    Alert.alert(
      '위치 권한',
      granted ? '위치 권한이 허용되었습니다.' : '설정에서 위치 권한을 허용해주세요.',
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>설정</Text>

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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink, marginBottom: spacing.md },
  section: { marginBottom: spacing.md },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.ink, marginBottom: spacing.sm },
  row: { fontSize: 14, color: '#5b5b66', marginBottom: spacing.sm },
  btn: { marginTop: spacing.xs },
  hint: { fontSize: 11, color: colors.grey, marginTop: spacing.sm, lineHeight: 16 },
  logout: { marginTop: spacing.lg },
});
