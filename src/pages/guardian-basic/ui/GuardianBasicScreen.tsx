import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  GuardianProfileFields,
  useGuardianProfile,
  useUpdateGuardianProfile,
} from '@/entities/guardian';
import type { GuardianProfile } from '@/entities/guardian';
import { useAuthSession } from '@/features/auth';
import { resolveOnboardingRoute } from '@/features/onboarding';
import { colors, spacing, fontSize, fontWeight } from '@/shared/config/theme';
import { useAuthStore } from '@/shared/session/sessionStore';
import { Button } from '@/shared/ui/Button';
import { LoadingPaws } from '@/shared/ui/LoadingPaws';
import { useOverlay } from '@/shared/ui/overlay/index';
import { PawProgress } from '@/shared/ui/PawProgress';
import { ProfilePhotoPicker } from '@/shared/ui/ProfilePhotoPicker';
import { StackAppBar } from '@/shared/ui/StackAppBar';

interface GuardianBasicFormProps {
  isEditMode: boolean;
  initialProfile?: GuardianProfile;
}

function GuardianBasicForm({ isEditMode, initialProfile }: GuardianBasicFormProps) {
  const { logout } = useAuthSession();
  const userId = useAuthStore((s) => s.userId);
  const updateProfile = useUpdateGuardianProfile();
  const { showAlert, showToast } = useOverlay();
  const [values, setValues] = useState({
    guardianTitle: initialProfile?.guardianTitle ?? '',
    parentingStyle: initialProfile?.parentingStyle ?? '',
    currentConcern: initialProfile?.currentConcern ?? '',
  });
  const [profileImageUri, setProfileImageUri] = useState<string | null>(
    initialProfile?.guardianProfileImageUrl ?? null,
  );

  const canNext = values.guardianTitle.trim().length > 0;

  const handleCancel = async () => {
    if (isEditMode) {
      router.back();
      return;
    }

    const confirmed = await showAlert({
      icon: '🐾',
      title: '등록을 취소할까요?',
      message: '입력한 내용은 저장되지 않아요.',
      cancelLabel: '계속 등록',
      confirmLabel: '취소하기',
      destructive: true,
    });
    if (!confirmed) return;
    await logout();
    router.replace('/(auth)/login');
  };

  const handleNext = async () => {
    try {
      await updateProfile.mutateAsync({
        guardianTitle: values.guardianTitle,
        parentingStyle: values.parentingStyle,
        currentConcern: values.currentConcern,
        profileImageUri:
          profileImageUri && profileImageUri !== initialProfile?.guardianProfileImageUrl
            ? profileImageUri
            : undefined,
      });
      if (isEditMode) {
        showToast({ message: '보호자 정보를 저장했어요', variant: 'success' });
        router.back();
        return;
      }
      // 이미 강아지가 등록된 사용자는 강아지 등록을 다시 거치지 않는다 (중복 등록 방지)
      const nextRoute = userId ? await resolveOnboardingRoute(userId) : '/(onboarding)/dogBasic';
      if (nextRoute === '/(tabs)') {
        router.dismissTo('/(tabs)');
        return;
      }
      router.push('/(onboarding)/dogBasic');
    } catch {
      showToast({
        message: '⚠️ 보호자 정보 저장에 실패했어요',
        variant: 'warning',
      });
    }
  };

  return (
    <>
      <View style={styles.screen}>
        {isEditMode ? (
          <StackAppBar title="보호자 정보 관리" onBackPress={() => router.back()} />
        ) : null}
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {!isEditMode ? (
            <View style={styles.progressWrap}>
              <PawProgress currentStep={1} />
            </View>
          ) : null}

          {!isEditMode ? (
            <>
              <Text style={styles.title}>먼저, 보호자님을 알려주세요</Text>
              <Text style={styles.subtitle}>AI 일기에서 보호자님을 부르는 호칭이에요</Text>
            </>
          ) : (
            <Text style={styles.editSubtitle}>
              AI 일기에 반영되는 호칭과 양육 정보를 수정할 수 있어요
            </Text>
          )}

          <ProfilePhotoPicker
            imageUri={profileImageUri}
            placeholderEmoji="🙂"
            sheetSubtitle="보호자 프로필 사진을 등록해주세요"
            onChange={setProfileImageUri}
            badgeBorderColor={colors.bg}
            style={styles.photoPicker}
          />

          <GuardianProfileFields
            values={values}
            onChange={(next) => setValues((prev) => ({ ...prev, ...next }))}
          />
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.btnRow}>
            {!isEditMode ? (
              <Button label="이전" variant="soft" onPress={handleCancel} style={styles.prevBtn} />
            ) : null}
            <Button
              label={isEditMode ? '저장' : '다음'}
              disabled={!canNext || updateProfile.isPending}
              onPress={handleNext}
              style={isEditMode ? styles.singleBtn : styles.nextBtn}
            />
          </View>
        </View>
      </View>
    </>
  );
}

export function GuardianBasicScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEditMode = mode === 'edit';
  const { data: profile, isLoading: isProfileLoading } = useGuardianProfile();

  if (isEditMode && isProfileLoading) {
    return (
      <View style={styles.screen}>
        <StackAppBar title="보호자 정보 관리" onBackPress={() => router.back()} />
        <LoadingPaws message="보호자 정보를 불러오는 중" />
      </View>
    );
  }

  if (isEditMode && !profile) {
    return (
      <View style={styles.screen}>
        <StackAppBar title="보호자 정보 관리" onBackPress={() => router.back()} />
        <LoadingPaws message="보호자 정보를 불러올 수 없어요" />
      </View>
    );
  }

  return (
    <GuardianBasicForm
      key={isEditMode ? profile?.guardianTitle : 'onboarding'}
      isEditMode={isEditMode}
      initialProfile={isEditMode ? profile : undefined}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.md,
  },
  progressWrap: { marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.fg,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.fgMuted,
    marginBottom: spacing.md,
  },
  photoPicker: { marginTop: spacing.sm },
  editSubtitle: {
    fontSize: fontSize.md,
    color: colors.fgMuted,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },

  footer: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bg,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  prevBtn: { flex: 1 },
  nextBtn: { flex: 2 },
  singleBtn: { flex: 1 },
});
