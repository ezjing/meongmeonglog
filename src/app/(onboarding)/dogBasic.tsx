import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BreedPicker } from '@/components/onboarding/BreedPicker';
import { Button } from '@/components/ui/Button';
import { PawProgress } from '@/components/ui/PawProgress';
import { colors, radius, spacing } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/walkStore';

export default function DogBasicScreen() {
  const { name, breed, birthDate, gender, weightKg, profileImageUri, setBasic } = useOnboardingStore();

  const canNext = name.trim().length > 0;

  const handlePickProfileImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setBasic({ profileImageUri: result.assets[0].uri });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <PawProgress currentStep={1} />

      <Text style={styles.title}>우리 아이를 소개해주세요</Text>
      <Text style={styles.subtitle}>기본 정보를 입력하면 등록이 완료돼요</Text>

      <Pressable style={styles.avatarWrap} onPress={handlePickProfileImage}>
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
