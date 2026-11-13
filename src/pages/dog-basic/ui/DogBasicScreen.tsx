import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { DEFAULT_DOG_NAME, useDogs } from '@/entities/dog';
import { BreedPicker, useOnboardingStore } from '@/features/onboarding';
import { colors, spacing, radius, fontSize, fontWeight, borderWidth } from '@/shared/config/theme';
import { Button } from '@/shared/ui/Button';
import { LoadingPaws } from '@/shared/ui/LoadingPaws';
import { PawProgress } from '@/shared/ui/PawProgress';
import { ProfilePhotoPicker } from '@/shared/ui/ProfilePhotoPicker';
import { StackAppBar } from '@/shared/ui/StackAppBar';

export function DogBasicScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEditMode = mode === 'edit';
  const { data: dogs, isLoading: isDogsLoading } = useDogs();
  const dog = dogs?.[0];
  const {
    name,
    breed,
    birthDate,
    gender,
    weightKg,
    profileImageUri,
    syncedDogId,
    setSyncedDogId,
    setBasic,
    setPersonality,
    reset,
  } = useOnboardingStore();

  // 수정 모드를 저장 없이 나가면 입력하던 값이 store에 남으므로, 다음 진입 때 서버 값을 다시 채우도록 비운다
  useEffect(() => {
    if (!isEditMode) return;
    return reset;
  }, [isEditMode, reset]);

  useEffect(() => {
    if (!isEditMode || !dog || syncedDogId === dog.dogId) return;
    setBasic({
      name: dog.name,
      breed: dog.breed,
      birthDate: dog.birthDate,
      gender: dog.gender,
      weightKg: dog.weightKg != null ? String(dog.weightKg) : '',
      profileImageUri: dog.profileImageUrl,
    });
    setPersonality({
      personality: dog.personality,
      speechStyle: dog.speechStyle ?? '기본',
      customPersonality: dog.customPersonality ?? '',
      customSpeechStyle: dog.customSpeechStyle ?? '',
    });
    setSyncedDogId(dog.dogId);
  }, [isEditMode, dog, syncedDogId, setSyncedDogId, setBasic, setPersonality]);

  const isStoreSyncedWithDog = !isEditMode || (dog != null && syncedDogId === dog.dogId);

  const canNext = name.trim().length > 0;

  if (isEditMode && (isDogsLoading || !isStoreSyncedWithDog)) {
    return (
      <View style={styles.screen}>
        <StackAppBar title="강아지 정보 관리" onBackPress={() => router.back()} />
        <LoadingPaws message="강아지 정보를 불러오는 중" />
      </View>
    );
  }

  if (isEditMode && !dog) {
    return (
      <View style={styles.screen}>
        <StackAppBar title="강아지 정보 관리" onBackPress={() => router.back()} />
        <LoadingPaws message="등록된 강아지가 없어요" />
      </View>
    );
  }

  return (
    <>
      <View style={styles.screen}>
        {isEditMode ? (
          <StackAppBar title="강아지 정보 관리" onBackPress={() => router.back()} />
        ) : null}
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {!isEditMode ? (
            <>
              <View style={styles.progressWrap}>
                <PawProgress currentStep={2} />
              </View>
              <Text style={styles.title}>우리 아이를 소개해주세요</Text>
              <Text style={styles.subtitle}>기본 정보를 입력하면 등록이 완료돼요</Text>
            </>
          ) : (
            <Text style={styles.editSubtitle}>기본 정보를 수정할 수 있어요</Text>
          )}

          <ProfilePhotoPicker
            imageUri={profileImageUri}
            placeholderEmoji="🐶"
            sheetSubtitle="강아지 프로필 사진을 등록해주세요"
            onChange={(uri) => setBasic({ profileImageUri: uri })}
          />

          <Text style={styles.label}>이름</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(text) => setBasic({ name: text })}
            placeholder={DEFAULT_DOG_NAME}
            placeholderTextColor={colors.grey}
          />

          <Text style={styles.label}>품종</Text>
          <BreedPicker value={breed} onSelect={(label) => setBasic({ breed: label })} />

          <Text style={styles.label}>생일</Text>
          <TextInput
            style={styles.input}
            value={birthDate}
            onChangeText={(text) => setBasic({ birthDate: text })}
            placeholder="2023-05-12"
            placeholderTextColor={colors.grey}
          />

          <Text style={styles.label}>몸무게 (kg)</Text>
          <TextInput
            style={styles.input}
            value={weightKg}
            onChangeText={(text) => setBasic({ weightKg: text.replace(/[^0-9.]/g, '') })}
            placeholder="3.5"
            placeholderTextColor={colors.grey}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>성별</Text>
          <View style={styles.genderRow}>
            {(['MALE', 'FEMALE'] as const).map((g) => (
              <Pressable
                key={g}
                onPress={() => setBasic({ gender: g })}
                style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
              >
                <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                  {g === 'MALE' ? '남아' : '여아'}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.btnRow}>
            {!isEditMode ? (
              <Button
                label="이전"
                variant="soft"
                onPress={() => router.back()}
                style={styles.prevBtn}
              />
            ) : null}
            <Button
              label="다음"
              disabled={!canNext}
              onPress={() =>
                router.push({
                  pathname: '/(onboarding)/dogPersonality',
                  params: isEditMode ? { mode: 'edit' } : undefined,
                })
              }
              style={isEditMode ? styles.singleBtn : styles.nextBtn}
            />
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  progressWrap: { marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  subtitle: { fontSize: fontSize.md, color: colors.grey, marginBottom: spacing.md },
  editSubtitle: {
    fontSize: fontSize.md,
    color: colors.grey,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },

  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.inkSoft,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: borderWidth.medium,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.ms,
    fontSize: fontSize.base,
    color: colors.ink,
    marginBottom: spacing.ms,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: spacing.ms,
    borderRadius: radius.md,
    borderWidth: borderWidth.medium,
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  genderBtnActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  genderText: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.inkSoft },
  genderTextActive: { color: colors.white },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  prevBtn: { flex: 1 },
  nextBtn: { flex: 2 },
  singleBtn: { flex: 1 },
});
