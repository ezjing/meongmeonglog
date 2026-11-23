import { Pressable, StyleSheet, Text } from 'react-native';

import { DogAvatar, type DogProfile } from '@/entities/dog';
import { colors, spacing, fontSize, fontWeight } from '@/shared/config/theme';
import { Button } from '@/shared/ui/Button';
import { BottomSheet } from '@/shared/ui/overlay';

const AVATAR_SIZE = 36;

interface WalkDogPickerSheetProps {
  visible: boolean;
  dogs: DogProfile[];
  checkedDogIds: string[];
  onToggle: (dogId: string) => void;
  onStart: () => void;
  onClose: () => void;
}

export function WalkDogPickerSheet({
  visible,
  dogs,
  checkedDogIds,
  onToggle,
  onStart,
  onClose,
}: WalkDogPickerSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="누구랑 산책할까요?">
      {dogs.map((dog) => {
        const checked = checkedDogIds.includes(dog.dogId);
        return (
          <Pressable
            key={dog.dogId}
            style={styles.row}
            onPress={() => onToggle(dog.dogId)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            accessibilityLabel={dog.name}
          >
            <DogAvatar imageUri={dog.profileImageUrl} size={AVATAR_SIZE} />
            <Text style={styles.name}>{dog.name}</Text>
            <Text style={[styles.check, checked && styles.checkOn]}>{checked ? '✓' : ''}</Text>
          </Pressable>
        );
      })}
      <Button label="산책 시작" onPress={onStart} style={styles.start} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.ms,
    paddingVertical: spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.fg,
  },
  check: {
    width: spacing.lg,
    textAlign: 'center',
    fontSize: fontSize.lg,
    color: colors.fgMuted,
  },
  checkOn: {
    color: colors.primary,
  },
  start: {
    marginTop: spacing.md,
  },
});
