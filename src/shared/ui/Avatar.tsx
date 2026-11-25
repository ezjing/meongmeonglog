import { Image } from 'expo-image';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors } from '@/shared/config/theme';

interface AvatarProps {
  imageUri?: string | null;
  size?: number;
  emoji: string;
  /** 없으면 칸 크기에 맞춰 줄인다. 사람 아바타는 예전 글자 크기를 유지한다. */
  emojiSize?: number;
  style?: ViewStyle;
}

export function Avatar({ imageUri, size = 42, emoji, emojiSize, style }: AvatarProps) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }, style]}>
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
        />
      ) : (
        <Text style={{ fontSize: emojiSize ?? size * 0.45 }}>{emoji}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.surfacePlaceholder,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
