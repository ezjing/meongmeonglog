import { memo } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import type { WalkPhoto } from '@/entities/walk/@x/diary';
import { colors, spacing, fontSize, fontWeight } from '@/shared/config/theme';
import { formatDate, formatDistance, formatDuration } from '@/shared/lib/formatDistance';
import { Card } from '@/shared/ui/Card';

import { DiaryThumbnail } from './DiaryThumbnail';
import type { DiaryListItem } from '../model/types';

interface DiaryListCardProps {
  diary: DiaryListItem;
  pendingPhotosByWalkId?: Record<string, WalkPhoto[]>;
  thumbnailSize?: number;
  /** 날짜 옆에 산책 시간·거리도 표시 */
  showWalkMeta?: boolean;
  onPress: (diary: DiaryListItem) => void;
  style?: ViewStyle;
}

/** 썸네일 + 날짜(·산책 정보) + 오늘의 한마디 한 줄로 된 일기 카드 (홈·캘린더·리스트) */
export const DiaryListCard = memo(function DiaryListCard({
  diary,
  pendingPhotosByWalkId,
  thumbnailSize,
  showWalkMeta = false,
  onPress,
  style,
}: DiaryListCardProps) {
  return (
    <Pressable onPress={() => onPress(diary)}>
      <Card style={[styles.card, style]}>
        <DiaryThumbnail
          diary={diary}
          pendingPhotosByWalkId={pendingPhotosByWalkId}
          size={thumbnailSize}
        />
        <View style={styles.body}>
          <Text style={styles.meta}>
            {formatDate(diary.createdAt)}
            {showWalkMeta && diary.durationSec ? ` · ${formatDuration(diary.durationSec)}` : ''}
            {showWalkMeta && diary.distanceMeter ? ` · ${formatDistance(diary.distanceMeter)}` : ''}
          </Text>
          <Text style={styles.quote} numberOfLines={1}>
            {diary.dailyQuote}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: spacing.ms, alignItems: 'center' },
  body: { flex: 1 },
  meta: { fontSize: fontSize.xs, color: colors.fgMuted, marginBottom: spacing.xs },
  quote: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.fg },
});
