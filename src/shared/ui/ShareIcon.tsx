import { SymbolView } from 'expo-symbols';

interface ShareIconProps {
  size: number;
  color: string;
}

export function ShareIcon({ size, color }: ShareIconProps) {
  return (
    <SymbolView
      name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
      size={size}
      tintColor={color}
    />
  );
}
