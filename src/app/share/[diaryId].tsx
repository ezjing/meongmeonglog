import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import type { ComponentRef } from 'react';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import ViewShot from 'react-native-view-shot';

import { WalkPhotoCarousel } from '@/components/diary/WalkPhotoCarousel';
import { Button } from '@/components/ui/Button';
import { useOverlay } from '@/components/ui/overlay';
import { QuoteCard } from '@/components/ui/ScreenContainer';
import {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  lineHeight,
  shadows,
} from '@/constants/theme';
import { useDiary, useShareCard } from '@/hooks/useDiaries';
import { useDiaryDogName } from '@/hooks/useDogName';
import { useDiaryWalkPhotos } from '@/hooks/useWalkPhotos';
import { formatDate } from '@/lib/utils/formatDistance';

const PHOTO_HEIGHT = 150;

export default function ShareScreen() {
  const { diaryId } = useLocalSearchParams<{ diaryId: string }>();
  const { data: diary } = useDiary(diaryId ?? '');
  const dogName = useDiaryDogName(diary?.dogName);
  const shareCard = useShareCard();
  const { showToast } = useOverlay();
  const viewShotRef = useRef<ComponentRef<typeof ViewShot>>(null);
  const [remoteUrl, setRemoteUrl] = useState<string | null>(null);
  const photos = useDiaryWalkPhotos(diary?.walkId, diary?.thumbnailUrl);
  const { width } = useWindowDimensions();
  const cardWidth = width - spacing.md * 2;

  const shareStartedRef = useRef(false);

  useEffect(() => {
    if (!diaryId || shareStartedRef.current) return;
    shareStartedRef.current = true;

    shareCard
      .mutateAsync(diaryId)
      .then(setRemoteUrl)
      .catch(() => {});
  }, [diaryId, shareCard]);

  const handleSaveAndShare = async () => {
    try {
      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture();
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          showToast({
            message: '📶 이 기기에서는 공유 기능을 사용할 수 없어요',
            variant: 'default',
          });
        }
      }
    } catch {
      showToast({ message: '⚠️ 이미지 저장에 실패했어요', variant: 'warning' });
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

      {remoteUrl ? <Text style={styles.remoteHint}>서버 카드 URL 생성됨</Text> : null}

      <Text style={styles.sectionLabel}>공유하기</Text>
      <Button
        label="💬  카카오톡 공유"
        variant="kakao"
        onPress={handleSaveAndShare}
        style={styles.shareBtn}
      />
      <Button label="📷  인스타그램 공유" onPress={handleSaveAndShare} style={styles.instaBtn} />
      <Button
        label="⬇️  이미지 저장 후 공유"
        variant="soft"
        onPress={handleSaveAndShare}
        style={styles.shareBtn}
      />

      <Button
        label="완료"
        variant="outline"
        onPress={() => router.dismissTo('/(tabs)')}
        style={styles.done}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading: { color: colors.grey },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
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
    color: colors.white,
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
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  remoteHint: { fontSize: fontSize.xs, color: colors.grey, marginBottom: spacing.sm },
  sectionLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.grey,
    marginBottom: spacing.sm,
  },
  shareBtn: { marginBottom: spacing.sm },
  instaBtn: { backgroundColor: colors.instagram, marginBottom: spacing.sm },
  done: { marginTop: spacing.sm },
});
