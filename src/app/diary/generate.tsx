import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingPaws } from "@/components/ui/LoadingPaws";
import { QuoteCard } from "@/components/ui/ScreenContainer";
import { useOverlay } from "@/components/ui/overlay";
import { colors, spacing } from "@/constants/theme";
import { useGenerateDiary } from "@/hooks/useDiaries";
import { formatDistance, formatDuration } from "@/lib/utils/formatDistance";
import { useWalkStore } from "@/stores/walkStore";
import type { Diary } from "@/types/domain";

export default function DiaryGenerateScreen() {
  const { walkId } = useLocalSearchParams<{ walkId: string }>();
  const generateDiary = useGenerateDiary();
  const resetWalk = useWalkStore((s) => s.reset);
  const { showToast } = useOverlay();
  const [diary, setDiary] = useState<Diary | null>(null);

  useEffect(() => {
    if (!walkId) return;
    generateDiary
      .mutateAsync(walkId)
      .then((result) => {
        setDiary(result);
        resetWalk();
      })
      .catch(() => {});
  }, [walkId]);

  if (generateDiary.isError) {
    const message =
      generateDiary.error instanceof Error
        ? generateDiary.error.message
        : "일기 생성에 실패했어요";
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{message}</Text>
        <Button
          label="다시 시도"
          onPress={() => walkId && generateDiary.mutate(walkId)}
        />
      </View>
    );
  }

  if (generateDiary.isPending || !diary) {
    return <LoadingPaws message="코코가 일기를 쓰고 있어요" />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero} />

      <Card>
        <Text style={styles.diaryTitle}>코코의 일기</Text>
        <Text style={styles.diaryBody}>{diary.content}</Text>
      </Card>

      <QuoteCard quote={diary.dailyQuote} />

      <View style={styles.chips}>
        <Text style={styles.chip}>🚶 {formatDistance(1200)}</Text>
        <Text style={styles.chip}>⏱ {formatDuration(1080)}</Text>
      </View>

      <View style={styles.actions}>
        <Button
          label="저장만 하기"
          variant="soft"
          style={styles.actionBtn}
          onPress={() => {
            showToast({ message: '🐾 일기가 저장되었어요', variant: 'success' });
            router.replace("/(tabs)");
          }}
        />
        <Button
          label="저장하고 공유하기"
          style={styles.actionBtnWide}
          onPress={() => router.push(`/share/${diary.diaryId}`)}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  error: { color: colors.apricotDark, marginBottom: spacing.md },
  hero: {
    height: 140,
    borderRadius: 14,
    backgroundColor: colors.apricot,
    marginBottom: spacing.md,
  },
  diaryTitle: {
    fontWeight: "800",
    fontSize: 14,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  diaryBody: { fontSize: 13, lineHeight: 22, color: colors.ink },
  chips: { flexDirection: "row", gap: spacing.sm, marginVertical: spacing.sm },
  chip: {
    fontSize: 11,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    overflow: "hidden",
  },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  actionBtn: { flex: 1 },
  actionBtnWide: { flex: 1.3 },
});
