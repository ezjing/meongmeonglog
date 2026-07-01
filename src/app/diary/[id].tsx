import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { WalkPhotoCarousel } from '@/components/diary/WalkPhotoCarousel';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { QuoteCard } from '@/components/ui/ScreenContainer';
import { useDiary } from '@/hooks/useDiaries';
import { useDiaryDogName } from '@/hooks/useDogName';
import { useDiaryWalkPhotos } from '@/hooks/useWalkPhotos';
import { formatDate, formatDistance, formatDuration } from '@/lib/utils/formatDistance';
import { colors, spacing } from '@/constants/theme';

export default function DiaryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: diary, isLoading } = useDiary(id ?? '');
  const dogName = useDiaryDogName(diary?.dogName);
  const photos = useDiaryWalkPhotos(diary?.walkId, diary?.thumbnailUrl);
  const { width } = useWindowDimensions();
  const heroWidth = width - spacing.md * 2;

  if (isLoading || !diary) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>{isLoading ? '불러오는 중...' : '일기를 찾을 수 없어요'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroWrap}>
        <WalkPhotoCarousel
          photos={photos}
          width={heroWidth}
          height={140}
          borderRadius={14}
        >
          <Button
            label="←"
            variant="soft"
            onPress={() => router.back()}
            style={styles.backBtn}
          />
          <Button
            label="↗"
            variant="soft"
            onPress={() => router.push(`/share/${diary.diaryId}`)}
            style={styles.shareBtn}
          />
        </WalkPhotoCarousel>
      </View>

      <Card>
        <Text style={styles.title}>
          {dogName}의 일기 · {formatDate(diary.createdAt)}
        </Text>
        <Text style={styles.body}>{diary.content}</Text>
      </Card>

      <QuoteCard quote={diary.dailyQuote} />

      <View style={styles.metaRow}>
        {diary.distanceMeter ? (
          <Text style={styles.meta}>🚶 {formatDistance(diary.distanceMeter)}</Text>
        ) : null}
        {diary.durationSec ? (
          <Text style={styles.meta}>⏱ {formatDuration(diary.durationSec)}</Text>
        ) : null}
        {photos.length > 0 ? (
          <Text style={styles.meta}>📷 {photos.length}장</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading: { color: colors.grey },
  heroWrap: { marginBottom: spacing.md },
  backBtn: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    width: 36,
    paddingVertical: 6,
    zIndex: 1,
  },
  shareBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 36,
    paddingVertical: 6,
    zIndex: 1,
  },
  title: { fontWeight: '800', fontSize: 14, color: colors.ink, marginBottom: spacing.sm },
  body: { fontSize: 13, lineHeight: 22, color: colors.ink },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  meta: {
    fontSize: 11,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
});
