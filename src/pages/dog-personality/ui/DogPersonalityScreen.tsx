import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import {
  DogAvatar,
  DEFAULT_DOG_NAME,
  personalityOptions,
  speechStyleOptions,
  useDogs,
  useUpdateDog,
  uploadDogProfileImage,
} from '@/entities/dog';
import { toDogInput, useOnboardingStore } from '@/features/onboarding';
import { colors, spacing, radius, fontSize, fontWeight, borderWidth } from '@/shared/config/theme';
import { useAuthStore } from '@/shared/session/sessionStore';
import { Button } from '@/shared/ui/Button';
import { Chip } from '@/shared/ui/Chip';
import {
  KeyboardAwareScrollView,
  useScrollToEndOnFocus,
} from '@/shared/ui/KeyboardAwareScrollView';
import { useOverlay } from '@/shared/ui/overlay/index';
import { PawProgress } from '@/shared/ui/PawProgress';
import { StackAppBar } from '@/shared/ui/StackAppBar';

const AVATAR_SIZE = 64;
/** '기타'를 고르면 직접 입력칸을 보여준다 */
const OTHER_OPTION = '기타';
/** 직접 입력값은 AI 프롬프트에 그대로 들어가므로 길이를 제한한다 */
const CUSTOM_INPUT_MAX_LENGTH = 50;

export function DogPersonalityScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const navigation = useNavigation();
  const isEditMode = mode === 'edit';
  const userId = useAuthStore((s) => s.userId);
  const { data: dogs } = useDogs();
  const dog = dogs?.[0];
  const { ref: scrollRef, scrollToEnd } = useScrollToEndOnFocus();
  const updateDog = useUpdateDog();
  const { showToast } = useOverlay();
  const {
    name,
    personality,
    speechStyle,
    customPersonality,
    customSpeechStyle,
    profileImageUri,
    setPersonality,
    reset,
  } = useOnboardingStore(
    useShallow((s) => ({
      name: s.name,
      personality: s.personality,
      speechStyle: s.speechStyle,
      customPersonality: s.customPersonality,
      customSpeechStyle: s.customSpeechStyle,
      profileImageUri: s.profileImageUri,
      setPersonality: s.setPersonality,
      reset: s.reset,
    })),
  );

  const isOtherPersonality = personality.includes(OTHER_OPTION);
  const isOtherSpeechStyle = speechStyle === OTHER_OPTION;
  // '기타'를 골랐는데 비워두면 조용히 기본 말투로 바뀌므로 입력해야 넘어갈 수 있다
  const isCustomInputMissing =
    (isOtherPersonality && !customPersonality.trim()) ||
    (isOtherSpeechStyle && !customSpeechStyle.trim());
  const bubblePersonality = personality.filter((p) => p !== OTHER_OPTION);

  const togglePersonality = (item: string) => {
    const isSelected = personality.includes(item);
    const next = isSelected ? personality.filter((p) => p !== item) : [...personality, item];
    setPersonality({
      personality: next,
      ...(item === OTHER_OPTION && isSelected ? { customPersonality: '' } : {}),
    });
  };

  const selectSpeechStyle = (item: string) => {
    setPersonality({
      speechStyle: item,
      ...(item !== OTHER_OPTION ? { customSpeechStyle: '' } : {}),
    });
  };

  const handleNext = async () => {
    if (!isEditMode) {
      router.replace('/(onboarding)/welcome');
      return;
    }

    if (!dog || !userId) return;

    try {
      let profileImageUrl = dog.profileImageUrl ?? undefined;
      if (profileImageUri && profileImageUri !== dog.profileImageUrl) {
        profileImageUrl = await uploadDogProfileImage(userId, profileImageUri);
      }

      await updateDog.mutateAsync({
        dogId: dog.dogId,
        input: toDogInput(useOnboardingStore.getState(), profileImageUrl),
      });
      reset();
      showToast({ message: '강아지 정보를 저장했어요', variant: 'success' });
      // 수정 화면 묶음(기본 정보·성격)을 통째로 닫고 진입했던 화면(설정 등)으로 돌아간다
      const rootNavigation = navigation.getParent();
      if (rootNavigation?.canGoBack()) {
        rootNavigation.goBack();
      } else {
        router.dismissTo('/(tabs)');
      }
    } catch {
      showToast({
        message: '⚠️ 강아지 정보 저장에 실패했어요',
        variant: 'error',
      });
    }
  };

  return (
    <View style={styles.screen}>
      {isEditMode ? (
        <StackAppBar title="강아지 정보 관리" onBackPress={() => router.back()} />
      ) : null}
      <KeyboardAwareScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {!isEditMode ? (
          <View style={styles.progressWrap}>
            <PawProgress currentStep={3} />
          </View>
        ) : null}

        <DogAvatar imageUri={profileImageUri} size={AVATAR_SIZE} style={styles.avatar} />

        <Text style={styles.title}>{name || DEFAULT_DOG_NAME}는 어떤 성격인가요?</Text>
        <Text style={styles.subtitle}>중복 선택 가능 · AI 일기 말투에 반영돼요</Text>

        <View style={styles.chipRow}>
          {personalityOptions.map((item) => (
            <Chip
              key={item}
              label={item}
              selected={personality.includes(item)}
              onPress={() => togglePersonality(item)}
            />
          ))}
        </View>
        {isOtherPersonality ? (
          <TextInput
            style={styles.input}
            value={customPersonality}
            onChangeText={(text) => setPersonality({ customPersonality: text })}
            placeholder="예: 산책만 나가면 신나서 뛰어다녀요"
            placeholderTextColor={colors.fgSubtle}
            maxLength={CUSTOM_INPUT_MAX_LENGTH}
            onFocus={scrollToEnd}
          />
        ) : null}

        <Text style={styles.subtitle}>말투 (선택사항)</Text>
        <View style={styles.chipRow}>
          {speechStyleOptions.map((item) => (
            <Chip
              key={item}
              label={item}
              selected={speechStyle === item}
              onPress={() => selectSpeechStyle(item)}
            />
          ))}
        </View>
        {isOtherSpeechStyle ? (
          <TextInput
            style={styles.input}
            value={customSpeechStyle}
            onChangeText={(text) => setPersonality({ customSpeechStyle: text })}
            placeholder="예: 문장 끝에 '~멍!'을 붙여요"
            placeholderTextColor={colors.fgSubtle}
            maxLength={CUSTOM_INPUT_MAX_LENGTH}
            onFocus={scrollToEnd}
          />
        ) : null}

        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>
            🐾 &quot;{bubblePersonality.slice(0, 2).join('하고 ') || '우리 아이'} 말투로 일기를
            써줄게!&quot;
          </Text>
        </View>

        <View style={styles.btnRow}>
          <Button
            label="이전"
            variant="secondary"
            onPress={() => router.back()}
            style={styles.prevBtn}
          />
          <Button
            label={isEditMode ? '저장' : '다음'}
            disabled={personality.length === 0 || isCustomInputMissing}
            loading={updateDog.isPending}
            onPress={handleNext}
            style={styles.nextBtn}
          />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  progressWrap: { marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  avatar: { alignSelf: 'center', marginVertical: spacing.sm },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.fg,
    marginTop: spacing.sm,
  },
  subtitle: { fontSize: fontSize.md, color: colors.fgMuted, marginBottom: spacing.md },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: borderWidth.medium,
    borderColor: colors.border,
    borderRadius: radius.control,
    padding: spacing.ms,
    fontSize: fontSize.base,
    color: colors.fg,
    marginBottom: spacing.md,
  },
  bubble: {
    backgroundColor: colors.surface,
    borderWidth: borderWidth.medium,
    borderColor: colors.border,
    borderRadius: radius.cardSm,
    padding: spacing.ms,
    marginBottom: spacing.lg,
  },
  bubbleText: { fontSize: fontSize.md, color: colors.fgSecondary },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  prevBtn: { flex: 1 },
  nextBtn: { flex: 2 },
});
