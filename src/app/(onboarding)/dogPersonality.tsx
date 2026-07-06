import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { DogAvatar } from "@/components/dog/DogAvatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { PawProgress } from "@/components/ui/PawProgress";
import { StackAppBar } from "@/components/ui/StackAppBar";
import { useOverlay } from "@/components/ui/overlay";
import { DEFAULT_DOG_NAME } from "@/constants/dog";
import {
  personalityOptions,
  speechStyleOptions,
} from "@/constants/personalityOptions";
import { colors, radius, spacing } from "@/constants/theme";
import { useDogs, useUpdateDog } from "@/hooks/useAuthSession";
import { uploadDogProfileImage } from "@/lib/api/dogApi";
import { useAuthStore, useOnboardingStore } from "@/stores/walkStore";

function parseWeightKg(value: string): number | null {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export default function DogPersonalityScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEditMode = mode === "edit";
  const userId = useAuthStore((s) => s.userId);
  const { data: dogs } = useDogs();
  const dog = dogs?.[0];
  const updateDog = useUpdateDog();
  const { showToast } = useOverlay();
  const store = useOnboardingStore();
  const {
    name,
    breed,
    birthDate,
    gender,
    weightKg,
    personality,
    speechStyle,
    profileImageUri,
    setPersonality,
    reset,
  } = store;

  const togglePersonality = (item: string) => {
    const next = personality.includes(item)
      ? personality.filter((p) => p !== item)
      : [...personality, item];
    setPersonality({ personality: next });
  };

  const handleNext = async () => {
    if (!isEditMode) {
      router.push("/(onboarding)/welcome");
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
        input: {
          name,
          breed,
          birthDate,
          gender,
          personality,
          speechStyle,
          weightKg: parseWeightKg(weightKg),
          profileImageUrl,
        },
      });
      reset();
      showToast({ message: "강아지 정보를 저장했어요", variant: "success" });
      router.replace("/(tabs)");
    } catch {
      showToast({
        message: "⚠️ 강아지 정보 저장에 실패했어요",
        variant: "warning",
      });
    }
  };

  return (
    <View style={styles.screen}>
      {isEditMode ? (
        <StackAppBar
          title="강아지 정보 관리"
          onBackPress={() => router.back()}
        />
      ) : null}
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {!isEditMode ? (
        <View style={styles.progressWrap}>
          <PawProgress currentStep={3} />
        </View>
      ) : null}

      <DogAvatar imageUri={profileImageUri} size={64} style={styles.avatar} />

      <Text style={styles.title}>
        {name || DEFAULT_DOG_NAME}는 어떤 성격인가요?
      </Text>
      <Text style={styles.subtitle}>
        중복 선택 가능 · AI 일기 말투에 반영돼요
      </Text>

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

      <Text style={styles.subtitle}>말투 (선택사항)</Text>
      <View style={styles.chipRow}>
        {speechStyleOptions.map((item) => (
          <Chip
            key={item}
            label={item}
            selected={speechStyle === item}
            onPress={() => setPersonality({ speechStyle: item })}
          />
        ))}
      </View>

      <View style={styles.bubble}>
        <Text style={styles.bubbleText}>
          🐾 &quot;{personality.slice(0, 2).join("하고 ") || "우리 아이"} 말투로
          일기를 써줄게!&quot;
        </Text>
      </View>

      <View style={styles.btnRow}>
        <Button
          label="이전"
          variant="soft"
          onPress={() => router.back()}
          style={styles.prevBtn}
        />
        <Button
          label={isEditMode ? "저장" : "다음"}
          disabled={personality.length === 0 || updateDog.isPending}
          onPress={handleNext}
          style={styles.nextBtn}
        />
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  progressWrap: { marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  avatar: { alignSelf: "center", marginVertical: spacing.sm },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
    marginTop: spacing.sm,
  },
  subtitle: { fontSize: 12, color: colors.grey, marginBottom: spacing.md },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm - 2,
    marginBottom: spacing.md,
  },
  bubble: {
    backgroundColor: colors.white,
    borderWidth: 1.3,
    borderColor: colors.line,
    borderRadius: radius.md - 2,
    padding: spacing.md - 4,
    marginBottom: spacing.lg,
  },
  bubbleText: { fontSize: 12, color: "#5b5b66" },
  btnRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  prevBtn: { flex: 1 },
  nextBtn: { flex: 2 },
});
