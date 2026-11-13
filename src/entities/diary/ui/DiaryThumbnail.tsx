import { Image } from 'expo-image';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import type { WalkPhoto } from '@/entities/walk/@x/diary';
import { colors, radius } from '@/shared/config/theme';

import { resolveDiaryThumbnail } from '../lib/diaryThumbnail';
import type { DiaryListItem } from '../model/types';

const DEFAULT_SIZE = 46;

interface DiaryThumbnailProps {
  diary: Pick<DiaryListItem, 'walkId' | 'thumbnailUrl'>;
  pendingPhotosByWalkId?: Record<string, WalkPhoto[]>;
  size?: number;
  style?: ViewStyle;
}

export function DiaryThumbnail({
  diary,
  pendingPhotosByWalkId = {},
  size = DEFAULT_SIZE,
  style,
}: DiaryThumbnailProps) {
  const thumbUrl = resolveDiaryThumbnail(diary, pendingPhotosByWalkId);

  return (
    <View style={[styles.thumb, { width: size, height: size, borderRadius: radius.cardSm }, style]}>
      {thumbUrl ? (
        <Image
          source={{ uri: thumbUrl }}
          style={{ width: size, height: size, borderRadius: radius.cardSm }}
          contentFit="cover"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: {
    backgroundColor: colors.surfacePlaceholder,
    overflow: 'hidden',
  },
});
