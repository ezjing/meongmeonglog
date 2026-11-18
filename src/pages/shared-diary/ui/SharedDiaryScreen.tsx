import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { DiaryContentView } from '@/entities/diary';
import { useSharedDiary } from '@/features/share-link';
import { colors, spacing } from '@/shared/config/theme';
import { formatDate, formatDistance, formatDuration } from '@/shared/lib/formatDistance';
import { goBackOrHome } from '@/shared/lib/navigation';
import { StackAppBar } from '@/shared/ui/StackAppBar';

export function SharedDiaryScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { data: diary, isLoading, isError } = useSharedDiary(token ?? '');

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>불러오는 중...</Text>
      </View>
    );
  }

  if (isError || !diary) {
    return (
      <View style={styles.screen}>
        <StackAppBar title="산책 일기" onBackPress={goBackOrHome} />
        <View style={styles.center}>
          <Text style={styles.message}>공유가 중지되었거나 없는 일기예요</Text>
        </View>
      </View>
    );
  }

  const photos = diary.photos.map((photo, index) => ({
    id: `${token}-${index}`,
    walkId: '',
    imageUrl: photo.imageUrl,
    sortOrder: photo.sortOrder,
  }));

  return (
    <View style={styles.screen}>
      <StackAppBar title={formatDate(diary.createdAt)} onBackPress={goBackOrHome} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <DiaryContentView
          photos={photos}
          title={`${diary.dogName}의 일기 · ${formatDate(diary.createdAt)}`}
          content={diary.content}
          quote={diary.dailyQuote}
          chips={[
            diary.distanceMeter ? `🚶 ${formatDistance(diary.distanceMeter)}` : null,
            diary.durationSec ? `⏱ ${formatDuration(diary.durationSec)}` : null,
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  message: { color: colors.fgMuted, textAlign: 'center' },
});
