import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { DiaryContentView } from '@/entities/diary';
import { useSharedDiary } from '@/features/share-link';
import { colors, spacing } from '@/shared/config/theme';
import { formatDate, formatDistance, formatDuration } from '@/shared/lib/formatDistance';
import { Button } from '@/shared/ui/Button';
import { StackAppBar } from '@/shared/ui/StackAppBar';

import { startMeongmeonglog } from '../lib/startMeongmeonglog';

export function SharedDiaryScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { data: diary, isLoading, isError, refetch, isRefetching } = useSharedDiary(token ?? '');

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>불러오는 중...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.screen}>
        <StackAppBar title="산책 일기" />
        <View style={styles.center}>
          <Text style={styles.message}>일기를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</Text>
          <Button
            label="다시 시도"
            onPress={() => void refetch()}
            loading={isRefetching}
            style={styles.retry}
          />
        </View>
      </View>
    );
  }

  if (!diary) {
    return (
      <View style={styles.screen}>
        <StackAppBar title="산책 일기" />
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
      <StackAppBar title={formatDate(diary.createdAt)} />
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
        {/* 받은 사람을 멍멍로그로 안내한다. 기기별 이동은 startMeongmeonglog 참고 */}
        <Button label="나도 멍멍로그 시작하기" onPress={startMeongmeonglog} style={styles.start} />
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
  retry: { marginTop: spacing.md, alignSelf: 'stretch' },
  start: { marginTop: spacing.lg },
});
