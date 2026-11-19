import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useDiary } from '@/entities/diary';
import { useDiaryDogName } from '@/entities/dog';
import { colors, spacing, fontSize, fontWeight } from '@/shared/config/theme';
import { Button } from '@/shared/ui/Button';

import { CardCapture, ImageShareButtons, useImageShare } from './ImageShare';
import { ShareCardPreview } from './ShareCardPreview';
import { ShareLinkActions } from './ShareLinkActions';

export function ShareScreen() {
  const { diaryId } = useLocalSearchParams<{ diaryId: string }>();
  const { data: diary } = useDiary(diaryId ?? '');
  const dogName = useDiaryDogName(diary?.dogName);
  const { captureRef, shareImage } = useImageShare();
  const photos = diary?.photos ?? [];
  const { width } = useWindowDimensions();
  const cardWidth = width - spacing.md * 2;

  if (!diary) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>불러오는 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>공유 카드 미리보기</Text>

      <CardCapture captureRef={captureRef}>
        <ShareCardPreview
          dogName={dogName}
          createdAt={diary.createdAt}
          content={diary.content}
          dailyQuote={diary.dailyQuote}
          photos={photos}
          width={cardWidth}
        />
      </CardCapture>

      <Text style={styles.sectionLabel}>공유하기</Text>
      <ShareLinkActions diaryId={diary.diaryId} />
      <ImageShareButtons onShare={shareImage} />

      <Button
        label="완료"
        variant="secondary"
        onPress={() => router.dismissTo('/(tabs)')}
        style={styles.done}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading: { color: colors.fgMuted },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.fg,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.fgMuted,
    marginBottom: spacing.sm,
  },
  done: { marginTop: spacing.sm },
});
