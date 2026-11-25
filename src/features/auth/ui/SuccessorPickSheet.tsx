import { Pressable, StyleSheet, Text } from 'react-native';

import { formatWalkPartyName } from '@/entities/dog';
import { formatHouseholdTitle } from '@/entities/household';
import type { HouseholdGroup } from '@/entities/household';
import { colors, spacing, fontSize, fontWeight } from '@/shared/config/theme';
import { Button } from '@/shared/ui/Button';
import { BottomSheet } from '@/shared/ui/overlay';

interface SuccessorPickSheetProps {
  house: HouseholdGroup | null;
  dogs: { householdId: string; name: string; createdAt: string }[];
  userId: string | null;
  selectedUserId?: string;
  onSelect: (userId: string) => void;
  onNext: () => void;
  onClose: () => void;
}

export function SuccessorPickSheet({
  house,
  dogs,
  userId,
  selectedUserId,
  onSelect,
  onNext,
  onClose,
}: SuccessorPickSheetProps) {
  const admin = house?.members.find((member) => member.role === 'admin');
  const houseDogs = dogs
    .filter((dog) => dog.householdId === house?.householdId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const candidates = house?.members.filter((member) => member.userId !== userId) ?? [];

  return (
    <BottomSheet
      visible={house != null}
      title="강아지를 맡을 가족을 골라 주세요"
      subtitle={house ? formatHouseholdTitle(admin?.guardianTitle) : undefined}
      onClose={onClose}
    >
      {houseDogs.length > 0 ? (
        <Text style={styles.successorDogs}>
          {formatWalkPartyName(houseDogs[0]?.name ?? '', Math.max(houseDogs.length - 1, 0))}
        </Text>
      ) : null}
      {candidates.map((member) => {
        const selected = member.userId === selectedUserId;
        const label = member.guardianTitle?.trim() || '보호자';
        return (
          <Pressable
            key={member.userId}
            style={styles.successorRow}
            onPress={() => onSelect(member.userId)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
          >
            <Text style={styles.successorName}>{label}</Text>
            <Text style={selected ? styles.successorOn : styles.successorOff}>
              {selected ? '✓' : ''}
            </Text>
          </Pressable>
        );
      })}
      <Button
        label="다음"
        onPress={onNext}
        disabled={!selectedUserId}
        style={styles.successorNext}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  successorDogs: { fontSize: fontSize.base, color: colors.fgSecondary, marginBottom: spacing.sm },
  successorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  successorName: { flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.fg },
  successorOff: { width: spacing.lg, color: colors.fgMuted },
  successorOn: { width: spacing.lg, color: colors.primaryFg, fontSize: fontSize.lg },
  successorNext: { marginTop: spacing.md },
});
