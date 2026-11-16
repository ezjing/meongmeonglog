import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useDiary } from '@/entities/diary';
import { useDiaryDogName } from '@/entities/dog';
import { colors, spacing, fontSize, fontWeight } from '@/shared/config/theme';
import { Button } from '@/shared/ui/Button';

import { ShareCardPreview } from './ShareCardPreview';

/** 웹에서는 카드 캡처 공유를 보여주지 않는다. 링크 공유는 이후 단계에서 넣는다. */
export function ShareScreen() {
  const { diaryId } = useLocalSearchParams<{ diaryId: string }>();
  const { data: diary } = useDiary(diaryId ?? '');
  const dogName = useDiaryDogName(diary?.dogName);
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
      <ShareCardPreview
        dogName={dogName}
        createdAt={diary.createdAt}
        content={diary.content}
        dailyQuote={diary.dailyQuote}
        photos={photos}
        width={cardWidth}
      />
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
  done: { marginTop: spacing.sm },
});
