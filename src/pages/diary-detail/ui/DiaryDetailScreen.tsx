import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { DiaryContentView, useDiary } from '@/entities/diary';
import { useDiaryDogName } from '@/entities/dog';
import { colors, spacing } from '@/shared/config/theme';
import { formatDate, formatDistance, formatDuration } from '@/shared/lib/formatDistance';
import { goBackOrHome } from '@/shared/lib/navigation';
import { StackAppBar } from '@/shared/ui/StackAppBar';

export function DiaryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: diary, isLoading } = useDiary(id ?? '');
  const dogName = useDiaryDogName(diary?.dogName);
  const photos = diary?.photos ?? [];

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
          ].filter((chip): chip is string => chip != null)}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading: { color: colors.fgMuted },
});
