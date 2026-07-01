import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { WalkPhotoCarousel } from "@/components/diary/WalkPhotoCarousel";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingOverlayScreen } from "@/components/ui/LoadingOverlay";
import { QuoteCard } from "@/components/ui/ScreenContainer";
import { useOverlay } from "@/components/ui/overlay";
import { colors, spacing } from "@/constants/theme";
import { useDogDisplayName } from "@/hooks/useDogName";
import { useGenerateDiary } from "@/hooks/useDiaries";
import { useWalkPhotos } from "@/hooks/useWalkPhotos";
import { formatDistance, formatDuration } from "@/lib/utils/formatDistance";
import { useFinishWalkStore, useWalkStore } from "@/stores/walkStore";
import type { Diary } from "@/types/domain";

export default function DiaryGenerateScreen() {
  const { walkId } = useLocalSearchParams<{ walkId: string }>();
  const generateDiary = useGenerateDiary();
  const resetWalk = useWalkStore((s) => s.reset);
  const resetForm = useFinishWalkStore((s) => s.reset);
  const { showToast } = useOverlay();
  const dogName = useDogDisplayName();
  const photos = useWalkPhotos(walkId);
  const { width } = useWindowDimensions();
  const heroWidth = width - spacing.md * 2;
  const [diary, setDiary] = useState<Diary | null>(null);

  const isGenerating = generateDiary.isPending || !diary;

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

  useEffect(() => {
    return () => {
      resetForm();
    };
  }, [resetForm]);

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

  return (
    <LoadingOverlayScreen
      loading={isGenerating}
      title={`${dogName}의 일기를 쓰고 있어요`}
      subtitle="성격·말투와 산책 기록을 반영하는 중"
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.heroWrap}>
          <WalkPhotoCarousel
            photos={photos}
            width={heroWidth}
            height={140}
            borderRadius={14}
          />
        </View>

        <Card>
          <Text style={styles.diaryTitle}>{dogName}의 일기</Text>
          {!isGenerating && diary ? (
            <Text style={styles.diaryBody}>{diary.content}</Text>
          ) : null}
        </Card>

        {!isGenerating && diary ? (
          <>
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
                  showToast({
                    message: "🐾 일기가 저장되었어요",
                    variant: "success",
                  });
                  router.replace("/(tabs)");
                }}
              />
              <Button
                label="저장하고 공유하기"
                style={styles.actionBtnWide}
                onPress={() => router.push(`/share/${diary.diaryId}`)}
              />
            </View>
          </>
        ) : null}
      </ScrollView>
    </LoadingOverlayScreen>
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
    backgroundColor: colors.background,
  },
  error: { color: colors.apricotDark, marginBottom: spacing.md },
  heroWrap: { marginBottom: spacing.md },
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
