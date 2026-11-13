import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { DiaryContentView } from '@/entities/diary';
import type { Diary } from '@/entities/diary';
import { useDogDisplayName } from '@/entities/dog';
import { formatWalkWeather, useWalk, useWalkStore } from '@/entities/walk';
import { useGenerateDiary } from '@/features/diary-generate';
import { useWalkPhotos, useFinishWalkStore } from '@/features/walk-session';
import { colors, spacing } from '@/shared/config/theme';
import { formatDistance, formatDuration } from '@/shared/lib/formatDistance';
import { useBackConfirmAction } from '@/shared/lib/useBackConfirmAction';
import { Button } from '@/shared/ui/Button';
import { LoadingOverlayScreen } from '@/shared/ui/LoadingOverlay';
import { useOverlay } from '@/shared/ui/overlay/index';

export function DiaryGenerateScreen() {
  const { walkId } = useLocalSearchParams<{ walkId: string }>();
  const generateDiary = useGenerateDiary();
  const resetWalk = useWalkStore((s) => s.reset);
  const resetForm = useFinishWalkStore((s) => s.reset);
  const { showToast } = useOverlay();
  const dogName = useDogDisplayName();
  const photos = useWalkPhotos(walkId);
  const { data: walk } = useWalk(walkId);
  const [diary, setDiary] = useState<Diary | null>(null);

  const isGenerating = generateDiary.isPending || !diary;

  const startedRef = useRef(false);

  const runGenerate = useCallback(
    (id: string) => {
      generateDiary
        .mutateAsync(id)
        .then((result) => {
          setDiary(result);
          resetWalk();
        })
        .catch(() => {});
    },
    [generateDiary, resetWalk],
  );

  useEffect(() => {
    if (!walkId || startedRef.current) return;
    startedRef.current = true;
    runGenerate(walkId);
  }, [walkId, runGenerate]);

  useEffect(() => {
    return () => {
      resetForm();
    };
  }, [resetForm]);

  // 뒤로가기도 "저장만 하기"와 같이 홈으로 이동 (이전 산책 완료 화면은 이미 정리된 상태라 돌아가면 로딩에 갇힘)
  const allowLeaveRef = useRef<(() => void) | null>(null);

  const goHome = useCallback(() => {
    if (diary) {
      showToast({ message: '🐾 일기가 저장되었어요', variant: 'success' });
    }
    allowLeaveRef.current?.();
    router.dismissTo('/(tabs)');
  }, [diary, showToast]);

  const { allowLeave } = useBackConfirmAction(goHome);

  useEffect(() => {
    allowLeaveRef.current = allowLeave;
  }, [allowLeave]);

  if (generateDiary.isError) {
    const message =
      generateDiary.error instanceof Error ? generateDiary.error.message : '일기 생성에 실패했어요';
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{message}</Text>
        <Button label="다시 시도" onPress={() => walkId && runGenerate(walkId)} />
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
        <DiaryContentView
          photos={photos}
          title={`${dogName}의 일기`}
          content={isGenerating ? null : diary?.content}
          quote={isGenerating ? null : diary?.dailyQuote}
          chips={
            isGenerating
              ? []
              : [
                  walk?.distanceMeter != null ? `🚶 ${formatDistance(walk.distanceMeter)}` : null,
                  walk?.durationSec != null ? `⏱ ${formatDuration(walk.durationSec)}` : null,
                  formatWalkWeather(walk),
                ].filter((chip): chip is string => chip != null)
          }
        />

        {!isGenerating && diary ? (
          <>
            <View style={styles.actions}>
              <Button
                label="저장만 하기"
                variant="soft"
                style={styles.actionBtn}
                onPress={goHome}
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  error: { color: colors.apricotDark, marginBottom: spacing.md },

  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionBtn: { flex: 1 },
  actionBtnWide: { flex: 1.3 },
});
