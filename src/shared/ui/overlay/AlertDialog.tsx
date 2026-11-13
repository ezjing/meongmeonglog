import { Modal, StyleSheet, Text, View } from 'react-native';

import {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  lineHeight,
  shadows,
} from '@/shared/config/theme';

import { Button } from '../Button';
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
            <Button
              label={cancelLabel}
              variant="secondary"
              size="md"
              onPress={onCancel}
              style={styles.btn}
            />
            <Button
              label={confirmLabel}
              variant={destructive ? 'dangerFilled' : 'primary'}
              size="md"
              onPress={onConfirm}
              style={styles.btn}
            />
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
    backgroundColor: colors.surface,
    borderRadius: radius.modal,
    paddingHorizontal: spacing.ml,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    ...shadows.modal,
  },
  iconWrap: {
    width: ICON_WRAP_SIZE,
    height: ICON_WRAP_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.ms,
  },
  icon: {
    fontSize: fontSize.xxl,
    color: colors.primaryFg,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.fg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.fgMuted,
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
  btn: { flex: 1 },
});
