import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { DiaryContentView, useDiary } from '@/entities/diary';
import { useDiaryDogName } from '@/entities/dog';
import { isHouseholdAdmin, useHouseholds } from '@/entities/household';
import { countWalkDiaries, formatWalkCompanyChip, useWalkPeople } from '@/entities/walk';
import { colors, spacing } from '@/shared/config/theme';
import { formatDate, formatDistance, formatDuration } from '@/shared/lib/formatDistance';
import { goBackOrHome } from '@/shared/lib/navigation';
import { useAuthStore } from '@/shared/session/sessionStore';
import { Button } from '@/shared/ui/Button';
import { useOverlay } from '@/shared/ui/overlay';
import { StackAppBar } from '@/shared/ui/StackAppBar';

import { useDeleteDiaryRecord } from '../model/useDeleteDiaryRecord';

export function DiaryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: diary, isLoading } = useDiary(id ?? '');
  const { data: walkPeople = [] } = useWalkPeople(diary?.walkId);
  const userId = useAuthStore((s) => s.userId);
  const { data: households } = useHouseholds();
  const dogName = useDiaryDogName(diary?.dogName);
  const canDelete =
    (diary?.recordedBy != null && diary.recordedBy === userId) ||
    (diary?.householdId != null &&
      households != null &&
      isHouseholdAdmin(households, diary.householdId));
  const photos = diary?.photos ?? [];
  const { showAlert, showToast } = useOverlay();
  const { deleteDiaryRecord, isDeleting } = useDeleteDiaryRecord();

  const handleDeletePress = useCallback(async () => {
    if (!diary || isDeleting) return;

    let otherDiariesRemain = false;
    try {
      otherDiariesRemain = (await countWalkDiaries(diary.walkId)) > 1;
    } catch {
      showToast({
        message: '기록을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.',
        variant: 'error',
      });
      return;
    }

    const confirmed = await showAlert({
      icon: '🐾',
      title: '이 산책 기록을 삭제할까요?',
      message: otherDiariesRemain
        ? `${dogName}의 일기와 공유 링크가 삭제되고 되돌릴 수 없어요. 함께 산책한 다른 강아지의 일기는 남아요.`
        : '일기와 사진, 공유 링크가 함께 삭제되고 되돌릴 수 없어요.',
      cancelLabel: '취소',
      confirmLabel: '삭제하기',
      destructive: true,
    });
    if (!confirmed) return;

    try {
      await deleteDiaryRecord(diary);
      showToast({ message: '기록을 삭제했어요', variant: 'success' });
      goBackOrHome();
    } catch {
      showToast({
        message: '기록을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.',
        variant: 'error',
      });
    }
  }, [deleteDiaryRecord, diary, dogName, isDeleting, showAlert, showToast]);

  if (isLoading || !diary) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>{isLoading ? '불러오는 중...' : '일기를 찾을 수 없어요'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StackAppBar
        title={formatDate(diary.createdAt)}
        onBackPress={goBackOrHome}
        onSharePress={() => router.push(`/share/${diary.diaryId}`)}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <DiaryContentView
          photos={photos}
          title={`${dogName}의 일기 · ${formatDate(diary.createdAt)}`}
          content={diary.content}
          quote={diary.dailyQuote}
          chips={[
            diary.distanceMeter ? `🚶 ${formatDistance(diary.distanceMeter)}` : null,
            diary.durationSec ? `⏱ ${formatDuration(diary.durationSec)}` : null,
            photos.length > 0 ? `📷 ${photos.length}장` : null,
            formatWalkCompanyChip(
              walkPeople,
              households?.find((group) => group.householdId === diary.householdId)?.members.length ??
                0,
            ),
          ].filter((chip): chip is string => chip != null)}
        />
        {canDelete ? (
          <Button
            label="기록 삭제"
            variant="danger"
            loading={isDeleting}
            onPress={handleDeletePress}
            style={styles.deleteButton}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  deleteButton: { marginTop: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading: { color: colors.fgMuted },
});
