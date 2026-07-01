import { Image } from 'expo-image';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors } from '@/constants/theme';

interface DogAvatarProps {
  imageUri?: string | null;
  size?: number;
  style?: ViewStyle;
}

export function DogAvatar({ imageUri, size = 42, style }: DogAvatarProps) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }, style]}>
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
        />
      ) : (
        <Text style={[styles.emoji, { fontSize: size * 0.45 }]}>🐶</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.apricot,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emoji: {},
});
