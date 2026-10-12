import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  lineHeight,
  borderWidth,
  shadows,
} from '@/constants/theme';

import { OverlayBackdrop } from './OverlayBackdrop';
import type { AlertDialogOptions } from './types';

const ICON_WRAP_SIZE = 42;

interface AlertDialogProps extends AlertDialogOptions {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function AlertDialog({
  visible,
  icon = '🐾',
  title,
  message,
  cancelLabel = '취소',
  confirmLabel = '확인',
  destructive = false,
  onCancel,
  onConfirm,
}: AlertDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <OverlayBackdrop style={styles.center}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>{icon}</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.btnSoft]} onPress={onCancel}>
              <Text style={styles.btnSoftText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, destructive ? styles.btnDanger : styles.btnPrimary]}
              onPress={onConfirm}
            >
              <Text style={styles.btnPrimaryText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </OverlayBackdrop>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '82%',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.ml,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    ...shadows.overlay,
  },
  iconWrap: {
    width: ICON_WRAP_SIZE,
    height: ICON_WRAP_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.quoteBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.ms,
  },
  icon: {
    fontSize: fontSize.xxl,
    color: colors.apricotDark,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.ink,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.grey,
    lineHeight: lineHeight.sm,
    textAlign: 'center',
    marginBottom: spacing.ml,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    marginTop: spacing.sm,
  },
  btn: {
    flex: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.ms,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSoft: {
    backgroundColor: colors.white,
    borderWidth: borderWidth.thin,
    borderColor: colors.line,
  },
  btnSoftText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  btnPrimary: {
    backgroundColor: colors.apricot,
  },
  btnDanger: {
    backgroundColor: colors.danger,
  },
  btnPrimaryText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
});
