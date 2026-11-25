import { StyleSheet, Text, View } from 'react-native';

import { QuoteCard } from '@/entities/diary';
import { WalkPhotoCarousel, type WalkPhoto } from '@/entities/walk';
import { colors, spacing, radius, fontSize, lineHeight, shadows } from '@/shared/config/theme';
import { formatDate } from '@/shared/lib/format';

const PHOTO_HEIGHT = 150;

interface ShareCardPreviewProps {
  dogName: string;
  createdAt: string;
  content: string;
  dailyQuote: string;
  photos: WalkPhoto[];
  width: number;
}

export function ShareCardPreview({
  dogName,
  createdAt,
  content,
  dailyQuote,
  photos,
  width,
}: ShareCardPreviewProps) {
  return (
    <View style={styles.card}>
      <WalkPhotoCarousel photos={photos} width={width} height={PHOTO_HEIGHT}>
        <View style={styles.tagWrap}>
          <Text style={styles.tag}>
            🐾 {dogName} · {formatDate(createdAt)}
          </Text>
        </View>
      </WalkPhotoCarousel>
      <View style={styles.cardBody}>
        <Text style={styles.summary} numberOfLines={3}>
          {content}
        </Text>
        <QuoteCard quote={dailyQuote} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
