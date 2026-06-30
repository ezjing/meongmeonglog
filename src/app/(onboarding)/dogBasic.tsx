import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BreedPicker } from '@/components/onboarding/BreedPicker';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { Button } from '@/components/ui/Button';
import { BottomSheet, useOverlay } from '@/components/ui/overlay';
import { colors, radius, spacing } from '@/constants/theme';
import { pickImageFromCamera, pickImageFromLibrary } from '@/lib/pickImage';
import { useOnboardingStore } from '@/stores/walkStore';

export default function DogBasicScreen() {
  const { name, breed, birthDate, gender, weightKg, profileImageUri, setBasic, reset } =
    useOnboardingStore();
  const { showAlert } = useOverlay();
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);

  const canNext = name.trim().length > 0;

  const handleCancelRegistration = async () => {
    const confirmed = await showAlert({
      icon: '🐾',
      title: '등록을 취소할까요?',
      message: '입력한 내용은 저장되지 않아요.',
      cancelLabel: '계속 등록',
      confirmLabel: '취소하기',
      destructive: true,
    });
    if (!confirmed) return;
    reset();
    router.replace('/(auth)/login');
  };

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

  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <OnboardingHeader currentStep={1} onBack={handleCancelRegistration} />

      <Text style={styles.title}>우리 아이를 소개해주세요</Text>
      <Text style={styles.subtitle}>기본 정보를 입력하면 등록이 완료돼요</Text>

      <Pressable style={styles.avatarWrap} onPress={() => setPhotoSheetVisible(true)}>
        <View style={styles.avatar}>
          {profileImageUri ? (
            <Image source={{ uri: profileImageUri }} style={styles.avatarImage} contentFit="cover" />
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
        placeholder="코코"
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

      <Button
        label="다음"
        disabled={!canNext}
        onPress={() => router.push('/(onboarding)/dogPersonality')}
        style={styles.nextBtn}
      />
    </ScrollView>

    <BottomSheet
      visible={photoSheetVisible}
      onClose={() => setPhotoSheetVisible(false)}
      title="프로필 사진 추가"
      subtitle="강아지 프로필 사진을 등록해주세요"
      options={[
        { icon: '📷', label: '카메라로 촬영', onPress: handlePickFromCamera },
        { icon: '🖼️', label: '갤러리에서 선택', onPress: handlePickFromLibrary },
      ]}
    />
  </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  title: { fontSize: 18, fontWeight: '800', color: colors.ink, marginTop: spacing.sm },
  subtitle: { fontSize: 12, color: colors.grey, marginBottom: spacing.md },
  avatarWrap: { alignSelf: 'center', marginBottom: spacing.md, position: 'relative' },
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
  label: { fontSize: 11, fontWeight: '700', color: '#5b5b66', marginBottom: spacing.xs },
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
  genderRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
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
  nextBtn: { marginTop: spacing.sm },
});
