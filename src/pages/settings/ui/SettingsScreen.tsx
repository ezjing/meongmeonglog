import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { useSelectedDog } from '@/entities/dog';
import { useGuardianProfile } from '@/entities/guardian';
import {
  PROVIDER_LABEL,
  SuccessorPickSheet,
  useAccountEmail,
  useAuthSession,
  useConfirmLogout,
  useDeleteAccountFlow,
} from '@/features/auth';
import { SettingsDrawer, useOpenDogEdit } from '@/features/settings';
import { colors, spacing, fontSize, fontWeight, lineHeight } from '@/shared/config/theme';
import { openGuardianEdit } from '@/shared/lib/navigation';
import { useLocationPermissionCheck } from '@/shared/lib/useLocationPermissionCheck';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { TabAppBar } from '@/shared/ui/TabAppBar';

export function SettingsScreen() {
  const { provider } = useAuthSession();
  const { handleDeleteAccount, isDeletingAccount, successorSheet } = useDeleteAccountFlow();
  const confirmLogout = useConfirmLogout();
  const checkLocationPermission = useLocationPermissionCheck();
  const { data: accountEmail } = useAccountEmail();
  const { dog } = useSelectedDog();
  const openDogEdit = useOpenDogEdit();
  const { data: guardianProfile } = useGuardianProfile();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const guardianTitle = guardianProfile?.guardianTitle?.trim();

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
                onPress={() => openDogEdit(dog)}
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
      <SuccessorPickSheet {...successorSheet} />
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
  deleteAccount: { marginTop: spacing.sm },
});
