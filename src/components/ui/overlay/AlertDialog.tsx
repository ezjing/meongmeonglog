import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';

import { OverlayBackdrop } from './OverlayBackdrop';
import type { AlertDialogOptions } from './types';

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
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 8,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.quoteBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 19,
    color: colors.apricotDark,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    fontSize: 11,
    color: colors.grey,
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    marginTop: spacing.sm,
  },
  btn: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSoft: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  btnSoftText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.ink,
  },
  btnPrimary: {
    backgroundColor: colors.apricot,
  },
  btnDanger: {
    backgroundColor: colors.danger,
  },
  btnPrimaryText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.white,
  },
});
