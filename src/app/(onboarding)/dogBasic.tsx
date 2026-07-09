import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BreedPicker } from '@/components/onboarding/BreedPicker';
import { Button } from '@/components/ui/Button';
import { LoadingPaws } from '@/components/ui/LoadingPaws';
import { BottomSheet } from '@/components/ui/overlay';
import { PawProgress } from '@/components/ui/PawProgress';
import { StackAppBar } from '@/components/ui/StackAppBar';
import { DEFAULT_DOG_NAME } from '@/constants/dog';
import { colors, radius, spacing } from '@/constants/theme';
import { useDogs } from '@/hooks/useAuthSession';
import { pickImageFromCamera, pickImageFromLibrary } from '@/lib/pickImage';
import { useOnboardingStore } from '@/stores/walkStore';

export default function DogBasicScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEditMode = mode === 'edit';
  const { data: dogs, isLoading: isDogsLoading } = useDogs();
  const dog = dogs?.[0];
  const { name, breed, birthDate, gender, weightKg, profileImageUri, setBasic, setPersonality } =
    useOnboardingStore();
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const [isHydrated, setIsHydrated] = useState(!isEditMode);

  useEffect(() => {
    if (!isEditMode || !dog) return;
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
    });
    setIsHydrated(true);
  }, [isEditMode, dog, setBasic, setPersonality]);

  const canNext = name.trim().length > 0;

  const handlePickFromLibrary = async () => {
    const uris = await pickImageFromLibrary({
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (uris?.[0]) {
      setBasic({ profileImageUri: uris[0] });
    }
  };

  const handlePickFromCamera = async () => {
    const uris = await pickImageFromCamera({
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (uris?.[0]) {
      setBasic({ profileImageUri: uris[0] });
    }
  };

  if (isEditMode && (isDogsLoading || !isHydrated)) {
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

          <Pressable style={styles.avatarWrap} onPress={() => setPhotoSheetVisible(true)}>
            <View style={styles.avatar}>
              {profileImageUri ? (
                <Image
                  source={{ uri: profileImageUri }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <Text style={styles.avatarEmoji}>🐶</Text>
              )}
            </View>
            <View style={styles.camBadge}>
              <Text style={styles.camEmoji}>📷</Text>
            </View>
          </Pressable>

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

      <BottomSheet
        visible={photoSheetVisible}
        onClose={() => setPhotoSheetVisible(false)}
        title="프로필 사진 추가"
        subtitle="강아지 프로필 사진을 등록해주세요"
        options={[
          { icon: '📷', label: '카메라로 촬영', onPress: handlePickFromCamera },
          {
            icon: '🖼️',
            label: '갤러리에서 선택',
            onPress: handlePickFromLibrary,
          },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  progressWrap: { marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
    marginTop: spacing.sm,
  },
  subtitle: { fontSize: 12, color: colors.grey, marginBottom: spacing.md },
  editSubtitle: {
    fontSize: 12,
    color: colors.grey,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  avatarWrap: {
    alignSelf: 'center',
    marginBottom: spacing.md,
    position: 'relative',
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.clay,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarEmoji: { fontSize: 30 },
  camBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  camEmoji: { fontSize: 12 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5b5b66',
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1.3,
    borderColor: colors.line,
    borderRadius: radius.md - 2,
    padding: spacing.md - 4,
    fontSize: 14,
    color: colors.ink,
    marginBottom: spacing.md - 4,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: spacing.md - 4,
    borderRadius: radius.md - 2,
    borderWidth: 1.3,
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  genderBtnActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  genderText: { fontSize: 13, fontWeight: '700', color: '#5b5b66' },
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
