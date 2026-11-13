import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import type { ComponentRef } from 'react';
import { useRef } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import ViewShot from 'react-native-view-shot';

import { QuoteCard, useDiary } from '@/entities/diary';
import { useDiaryDogName } from '@/entities/dog';
import { WalkPhotoCarousel } from '@/entities/walk';
import {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  lineHeight,
  shadows,
} from '@/shared/config/theme';
import { formatDate } from '@/shared/lib/formatDistance';
import { Button } from '@/shared/ui/Button';
import { useOverlay } from '@/shared/ui/overlay/index';

const PHOTO_HEIGHT = 150;

export function ShareScreen() {
  const { diaryId } = useLocalSearchParams<{ diaryId: string }>();
  const { data: diary } = useDiary(diaryId ?? '');
  const dogName = useDiaryDogName(diary?.dogName);
  const { showToast } = useOverlay();
  const viewShotRef = useRef<ComponentRef<typeof ViewShot>>(null);
  const photos = diary?.photos ?? [];
  const { width } = useWindowDimensions();
  const cardWidth = width - spacing.md * 2;

  const handleSaveAndShare = async () => {
    try {
      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture();
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          showToast({
            message: '이 기기에서는 공유 기능을 사용할 수 없어요',
            variant: 'warning',
          });
        }
      }
    } catch {
      showToast({ message: '이미지 저장에 실패했어요', variant: 'error' });
    }
  };

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

      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
        <View style={styles.card}>
          <WalkPhotoCarousel photos={photos} width={cardWidth} height={PHOTO_HEIGHT}>
            <View style={styles.tagWrap}>
              <Text style={styles.tag}>
                🐾 {dogName} · {formatDate(diary.createdAt)}
              </Text>
            </View>
          </WalkPhotoCarousel>
          <View style={styles.cardBody}>
            <Text style={styles.summary} numberOfLines={3}>
              {diary.content}
            </Text>
            <QuoteCard quote={diary.dailyQuote} />
          </View>
        </View>
      </ViewShot>

      <Text style={styles.sectionLabel}>공유하기</Text>
      <Button
        label="💬  카카오톡 공유"
        variant="kakao"
        onPress={handleSaveAndShare}
        style={styles.shareBtn}
      />
      <Button
        label="📷  인스타그램 공유"
        variant="instagram"
        onPress={handleSaveAndShare}
        style={styles.instaBtn}
      />
      <Button
        label="⬇️  이미지 저장 후 공유"
        variant="secondary"
        onPress={handleSaveAndShare}
        style={styles.shareBtn}
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.cardLg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.raised,
  },
  tagWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.ms,
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.scrim,
    color: colors.fgInverse,
    fontSize: fontSize.xs,
    paddingHorizontal: spacing.ms,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  cardBody: { padding: spacing.ms },
  summary: {
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    color: colors.fg,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.fgMuted,
    marginBottom: spacing.sm,
  },
  shareBtn: { marginBottom: spacing.sm },
  instaBtn: { marginBottom: spacing.sm },
  done: { marginTop: spacing.sm },
});
