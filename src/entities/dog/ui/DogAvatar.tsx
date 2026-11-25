import type { ViewStyle } from 'react-native';

import { Avatar } from '@/shared/ui/Avatar';

const DEFAULT_SIZE = 42;

interface DogAvatarProps {
  imageUri?: string | null;
  size?: number;
  style?: ViewStyle;
}

export function DogAvatar({ imageUri, size = DEFAULT_SIZE, style }: DogAvatarProps) {
  return <Avatar imageUri={imageUri} size={size} emoji="🐶" style={style} />;
}
