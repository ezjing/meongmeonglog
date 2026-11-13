import { useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { WalkPhotoCarousel, type WalkPhoto } from '@/entities/walk/@x/diary';
import { colors, spacing, radius, fontSize, fontWeight, lineHeight } from '@/shared/config/theme';
import { Card } from '@/shared/ui/Card';
import { ImagePreviewModal } from '@/shared/ui/ImagePreviewModal';

import { QuoteCard } from './QuoteCard';

const PHOTO_HEIGHT_RATIO = 0.3;

interface DiaryContentViewProps {
  photos: WalkPhoto[];
  title: string;
  /** 생성 중처럼 아직 본문이 없으면 비워둔다 */
  content?: string | null;
  quote?: string | null;
  /** 거리·시간·날씨 등 하단 칩 */
  chips?: string[];
}

/**
 * 산책 사진 캐러셀(눌러서 확대) + 일기 본문 + 오늘의 한마디 + 칩 (일기 상세·생성 화면)
 * 사진을 화면 끝까지 붙이기 위해 부모 ScrollView의 좌우 padding이 spacing.md라고 가정한다.
 */
export function DiaryContentView({
  photos,
  title,
  content,
  quote,
  chips = [],
}: DiaryContentViewProps) {
  const { width, height: screenHeight } = useWindowDimensions();
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  return (
    <>
      <View style={styles.heroWrap}>
        <WalkPhotoCarousel
          photos={photos}
          width={width}
          height={Math.round(screenHeight * PHOTO_HEIGHT_RATIO)}
          onPhotoPress={(_, index) => setPreviewIndex(index)}
        />
      </View>

      <Card>
        <Text style={styles.title}>{title}</Text>
        {content ? <Text style={styles.body}>{content}</Text> : null}
      </Card>

      {quote ? <QuoteCard quote={quote} /> : null}

      {chips.length > 0 ? (
        <View style={styles.chips}>
          {chips.map((chip) => (
            <Text key={chip} style={styles.chip}>
              {chip}
            </Text>
          ))}
        </View>
      ) : null}

      <ImagePreviewModal
        visible={previewIndex != null}
        imageUris={photos.map((photo) => photo.imageUrl)}
        initialIndex={previewIndex ?? 0}
        onClose={() => setPreviewIndex(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    marginHorizontal: -spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    fontWeight: fontWeight.extrabold,
    fontSize: fontSize.base,
    color: colors.fg,
    marginBottom: spacing.sm,
  },
  body: { fontSize: fontSize.base, lineHeight: lineHeight.lg, color: colors.fg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginVertical: spacing.sm },
  chip: {
    fontSize: fontSize.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.ms,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
});
