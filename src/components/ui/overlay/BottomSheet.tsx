import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  borderWidth,
  shadows,
} from '@/constants/theme';

import { OverlayBackdrop } from './OverlayBackdrop';
import type { BottomSheetOption } from './types';

const HANDLE_WIDTH = 38;
const HANDLE_HEIGHT = 5;
const OPTION_ICON_SIZE = 30;

interface BottomSheetProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  options?: BottomSheetOption[];
  cancelLabel?: string;
  onClose: () => void;
  children?: React.ReactNode;
}

export function BottomSheet({
  visible,
  title,
  subtitle,
  options,
  cancelLabel = '취소',
  onClose,
  children,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <OverlayBackdrop onPress={onClose} style={styles.backdrop}>
        <Pressable style={styles.sheetWrap} onPress={(event) => event.stopPropagation()}>
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.ml) }]}>
            <View style={styles.handle} />
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            {options?.map((option) => (
              <Pressable
                key={option.label}
                style={styles.option}
                onPress={() => {
                  onClose();
                  option.onPress();
                }}
              >
                {option.icon ? (
                  <View
                    style={[
                      styles.optionIcon,
                      option.iconBg ? { backgroundColor: option.iconBg } : undefined,
                    ]}
                  >
                    {typeof option.icon === 'string' ? (
                      <Text style={styles.optionIconText}>{option.icon}</Text>
                    ) : (
                      option.icon
                    )}
                  </View>
                ) : null}
                <Text style={styles.optionLabel}>{option.label}</Text>
              </Pressable>
            ))}
            {children}
            <Pressable style={styles.cancel} onPress={onClose}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </OverlayBackdrop>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    width: '100%',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.ms,
    paddingHorizontal: spacing.ml,
    ...shadows.sheet,
  },
  handle: {
    width: HANDLE_WIDTH,
    height: HANDLE_HEIGHT,
    borderRadius: radius.full,
    backgroundColor: colors.line,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.extrabold,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.grey,
    marginBottom: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.ms,
    paddingVertical: spacing.ms,
    borderBottomWidth: borderWidth.hairline,
    borderBottomColor: colors.line,
  },
  optionIcon: {
    width: OPTION_ICON_SIZE,
    height: OPTION_ICON_SIZE,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  optionIconText: {
    fontSize: fontSize.lg,
  },
  optionLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  cancel: {
    marginTop: spacing.ms,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingVertical: spacing.ms,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.extrabold,
    color: colors.inkSoft,
  },
});
