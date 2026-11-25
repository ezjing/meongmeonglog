import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { DiaryContentView, invalidateDiaryLists, useGenerateDiary } from '@/entities/diary';
import type { Diary } from '@/entities/diary';
import { DEFAULT_DOG_NAME, useDogDisplayName, useSelectedDog } from '@/entities/dog';
import { formatWalkWeather, useWalk, useWalkDogIds, useWalkStore } from '@/entities/walk';
import { useWalkPhotos, useFinishWalkStore } from '@/features/walk-session';
import { colors, spacing } from '@/shared/config/theme';
import { formatDistance, formatDuration } from '@/shared/lib/format';
import { josa } from '@/shared/lib/josa';
import { useBackConfirmAction } from '@/shared/lib/useBackConfirmAction';
import { useAuthStore } from '@/shared/session/sessionStore';
import { Button } from '@/shared/ui/Button';
import { Chip } from '@/shared/ui/Chip';
import { LoadingOverlayScreen } from '@/shared/ui/LoadingOverlay';
import { useOverlay } from '@/shared/ui/overlay';

function parseDogIds(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return [];
  return raw.split(',').filter((id) => id.length > 0);
}

function diaryGenerateErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '일기 생성에 실패했어요';
}

function useLeaveToHome(hasSavedDiary: boolean) {
  const resetForm = useFinishWalkStore((s) => s.reset);
  const { showToast } = useOverlay();
  const allowLeaveRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      resetForm();
    };
  }, [resetForm]);

  const goHome = useCallback(() => {
    if (hasSavedDiary) {
      showToast({ message: '일기가 저장되었어요', variant: 'success' });
    }
    allowLeaveRef.current?.();
    router.dismissTo('/(tabs)');
  }, [hasSavedDiary, showToast]);

  const { allowLeave } = useBackConfirmAction(goHome);

  useEffect(() => {
    allowLeaveRef.current = allowLeave;
  }, [allowLeave]);

  return goHome;
}

function SingleDogGenerate({ walkId, dogId }: { walkId: string; dogId?: string }) {
  const generateDiary = useGenerateDiary();
  const resetWalk = useWalkStore((s) => s.reset);
  const { dogs } = useSelectedDog();
  const fallbackName = useDogDisplayName();
  const dogName = dogs?.find((dog) => dog.dogId === dogId)?.name?.trim() || fallbackName;
  const photos = useWalkPhotos(walkId);
  const { data: walk } = useWalk(walkId);
  const [diary, setDiary] = useState<Diary | null>(null);
  const goHome = useLeaveToHome(diary != null);

  const isGenerating = generateDiary.isPending || !diary;
  const startedRef = useRef(false);

  const runGenerate = useCallback(
    (id: string) => {
      generateDiary
        .mutateAsync({ walkId: id, dogId })
        .then((result) => {
          setDiary(result);
          resetWalk();
        })
        .catch(() => {});
    },
    [dogId, generateDiary, resetWalk],
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    runGenerate(walkId);
  }, [walkId, runGenerate]);

  if (generateDiary.isError) {
    const message = diaryGenerateErrorMessage(generateDiary.error);
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{message}</Text>
        <Button label="다시 시도" onPress={() => runGenerate(walkId)} />
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
          <View style={styles.actions}>
            <Button
              label="저장만 하기"
              variant="secondary"
              style={styles.actionBtn}
              onPress={goHome}
            />
            <Button
              label="저장하고 공유하기"
              style={styles.actionBtnWide}
              onPress={() => router.push(`/share/${diary.diaryId}`)}
            />
          </View>
        ) : null}
      </ScrollView>
    </LoadingOverlayScreen>
  );
}

interface DogSlot {
  dogId: string;
  phase: 'waiting' | 'done' | 'error';
  diary?: Diary;
  errorMessage?: string;
}

function MultiDogGenerate({ walkId, dogIds }: { walkId: string; dogIds: string[] }) {
  const generateDiary = useGenerateDiary({ refreshLists: false });
  const queryClient = useQueryClient();
  const resetWalk = useWalkStore((s) => s.reset);
  const { dogs } = useSelectedDog();
  const photos = useWalkPhotos(walkId);
  const { data: walk } = useWalk(walkId);
  const [slots, setSlots] = useState<DogSlot[]>(() =>
    dogIds.map((dogId) => ({ dogId, phase: 'waiting' })),
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewIndex, setViewIndex] = useState(0);
  const [batchDone, setBatchDone] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const startedRef = useRef(false);

  const savedAny = slots.some((slot) => slot.phase === 'done');
  const goHome = useLeaveToHome(savedAny);

  const nameOf = useCallback(
    (dogId: string) => dogs?.find((dog) => dog.dogId === dogId)?.name?.trim() || DEFAULT_DOG_NAME,
    [dogs],
  );

  const refreshLists = useCallback(() => {
    const userId = useAuthStore.getState().userId;
    if (!userId) return;
    invalidateDiaryLists(queryClient, userId);
  }, [queryClient]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    void (async () => {
      for (let index = 0; index < dogIds.length; index += 1) {
        const dogId = dogIds[index];
        setActiveIndex(index);
        try {
          const diary = await generateDiary.mutateAsync({ walkId, dogId });
          setSlots((current) =>
            current.map((slot) => (slot.dogId === dogId ? { dogId, phase: 'done', diary } : slot)),
          );
        } catch (error) {
          const errorMessage = diaryGenerateErrorMessage(error);
          setSlots((current) =>
            current.map((slot) =>
              slot.dogId === dogId ? { dogId, phase: 'error', errorMessage } : slot,
            ),
          );
        }
      }
      resetWalk();
      refreshLists();
      setBatchDone(true);
    })();
  }, [dogIds, generateDiary, refreshLists, resetWalk, walkId]);

  const retry = async (dogId: string) => {
    const index = dogIds.indexOf(dogId);
    setRetryingId(dogId);
    if (index >= 0) setActiveIndex(index);
    try {
      const diary = await generateDiary.mutateAsync({ walkId, dogId });
      setSlots((current) =>
        current.map((slot) => (slot.dogId === dogId ? { dogId, phase: 'done', diary } : slot)),
      );
      refreshLists();
    } catch (error) {
      const errorMessage = diaryGenerateErrorMessage(error);
      setSlots((current) =>
        current.map((slot) =>
          slot.dogId === dogId ? { dogId, phase: 'error', errorMessage } : slot,
        ),
      );
    } finally {
      setRetryingId(null);
    }
  };

  const progressIndex = retryingId ? Math.max(dogIds.indexOf(retryingId), 0) : activeIndex;
  const progressName = nameOf(dogIds[progressIndex] ?? dogIds[0]);
  const viewed = slots[viewIndex] ?? slots[0];
  const viewedName = viewed ? nameOf(viewed.dogId) : progressName;
  const showOverlay = !batchDone || retryingId != null;

  return (
    <LoadingOverlayScreen
      loading={showOverlay}
      title={`${progressName}${josa(progressName, '이', '가')} 일기를 쓰고 있어요 (${progressIndex + 1}/${dogIds.length})`}
      subtitle="성격·말투와 산책 기록을 반영하는 중"
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.chipRow}>
          {dogIds.map((dogId, index) => (
            <Chip
              key={dogId}
              label={nameOf(dogId)}
              selected={index === viewIndex}
              onPress={() => setViewIndex(index)}
            />
          ))}
        </View>

        {viewed?.phase === 'error' ? (
          <View style={styles.centerInline}>
            <Text style={styles.error}>{viewedName}의 일기를 만들지 못했어요</Text>
            {viewed.errorMessage ? <Text style={styles.error}>{viewed.errorMessage}</Text> : null}
            <Button label="다시 시도" onPress={() => retry(viewed.dogId)} />
          </View>
        ) : (
          <DiaryContentView
            photos={photos}
            title={`${viewedName}의 일기`}
            content={viewed?.diary?.content}
            quote={viewed?.diary?.dailyQuote}
            chips={
              viewed?.diary
                ? [
                    walk?.distanceMeter != null ? `🚶 ${formatDistance(walk.distanceMeter)}` : null,
                    walk?.durationSec != null ? `⏱ ${formatDuration(walk.durationSec)}` : null,
                    formatWalkWeather(walk),
                  ].filter((chip): chip is string => chip != null)
                : []
            }
          />
        )}

        {batchDone ? (
          <View style={styles.actions}>
            <Button
              label="저장만 하기"
              variant="secondary"
              style={styles.actionBtn}
              onPress={goHome}
            />
            {viewed?.diary ? (
              <Button
                label="저장하고 공유하기"
                style={styles.actionBtnWide}
                onPress={() => router.push(`/share/${viewed.diary?.diaryId}`)}
              />
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </LoadingOverlayScreen>
  );
}

export function DiaryGenerateScreen() {
  const { walkId, dogIds: dogIdsParam } = useLocalSearchParams<{
    walkId: string;
    dogIds?: string;
  }>();
  const paramIds = useMemo(() => parseDogIds(dogIdsParam), [dogIdsParam]);
  const { data: fetchedIds, isLoading } = useWalkDogIds(paramIds.length > 0 ? undefined : walkId);
  const dogIds = paramIds.length > 0 ? paramIds : (fetchedIds ?? []);
  const ready = paramIds.length > 0 || !isLoading;
  const fallbackName = useDogDisplayName();

  if (!walkId || !ready) {
    return (
      <LoadingOverlayScreen
        loading
        title={`${fallbackName}의 일기를 쓰고 있어요`}
        subtitle="성격·말투와 산책 기록을 반영하는 중"
      />
    );
  }

  if (dogIds.length <= 1) {
    return <SingleDogGenerate walkId={walkId} dogId={dogIds[0]} />;
  }

  return <MultiDogGenerate walkId={walkId} dogIds={dogIds} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.bg,
  },
  centerInline: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  error: { color: colors.primaryFg, marginBottom: spacing.md, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionBtn: { flex: 1 },
  actionBtnWide: { flex: 1.3 },
});
