import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { GuardianProfileFields } from "@/components/guardian/GuardianProfileFields";
import { Button } from "@/components/ui/Button";
import { LoadingPaws } from "@/components/ui/LoadingPaws";
import { useOverlay } from "@/components/ui/overlay";
import { colors, spacing } from "@/constants/theme";
import {
  useGuardianProfile,
  useUpdateGuardianProfile,
} from "@/hooks/useGuardianProfile";

export default function GuardianEditScreen() {
  const { data: profile, isLoading } = useGuardianProfile();
  const updateProfile = useUpdateGuardianProfile();
  const { showToast } = useOverlay();
  const [values, setValues] = useState({
    guardianTitle: "",
    parentingStyle: "",
    currentConcern: "",
  });

  useEffect(() => {
    if (!profile) return;
    setValues({
      guardianTitle: profile.guardianTitle ?? "",
      parentingStyle: profile.parentingStyle ?? "",
      currentConcern: profile.currentConcern ?? "",
    });
  }, [profile]);

  const canSave = values.guardianTitle.trim().length > 0;

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        guardianTitle: values.guardianTitle,
        parentingStyle: values.parentingStyle,
        currentConcern: values.currentConcern,
      });
      showToast({ message: "보호자 정보를 저장했어요", variant: "success" });
      router.back();
    } catch {
      showToast({
        message: "⚠️ 보호자 정보 저장에 실패했어요",
        variant: "warning",
      });
    }
  };

  if (isLoading) {
    return <LoadingPaws message="보호자 정보를 불러오는 중" />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
        <Text style={styles.backText}>←</Text>
      </Pressable>

      <Text style={styles.title}>보호자 정보</Text>
      <Text style={styles.subtitle}>
        AI 일기에 반영되는 호칭과 양육 정보를 수정할 수 있어요
      </Text>

      <GuardianProfileFields
        values={values}
        onChange={(next) => setValues((prev) => ({ ...prev, ...next }))}
      />

      <Button
        label="저장"
        disabled={!canSave || updateProfile.isPending}
        onPress={handleSave}
        style={styles.saveBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  backBtn: {
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  backText: {
    fontSize: 22,
    color: colors.ink,
    fontWeight: "600",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  subtitle: { fontSize: 12, color: colors.grey, marginBottom: spacing.md },
  saveBtn: { marginTop: spacing.sm },
});
