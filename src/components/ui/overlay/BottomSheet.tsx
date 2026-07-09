import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius } from '@/constants/theme';

import { OverlayBackdrop } from './OverlayBackdrop';
import type { BottomSheetOption } from './types';

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
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
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
                    {option.icon}
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
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 10,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 10,
  },
  handle: {
    width: 38,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.line,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10.5,
    color: colors.grey,
    marginBottom: 14,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  optionIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  optionLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.ink,
  },
  cancel: {
    marginTop: 12,
    backgroundColor: colors.background,
    borderRadius: 13,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#5b5b66',
  },
});
