import { Image } from 'expo-image';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radius } from '@/constants/theme';
import { resolveDiaryThumbnail } from '@/lib/utils/diaryThumbnail';
import type { DiaryListItem, WalkPhoto } from '@/types/domain';

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
    <View style={[styles.thumb, { width: size, height: size, borderRadius: radius.md }, style]}>
      {thumbUrl ? (
        <Image
          source={{ uri: thumbUrl }}
          style={{ width: size, height: size, borderRadius: radius.md }}
          contentFit="cover"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: {
    backgroundColor: colors.clay,
    overflow: 'hidden',
  },
});
