import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/constants/theme';

import { OverlayBackdrop } from './OverlayBackdrop';

export interface DrawerItem {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

interface DrawerProps {
  visible: boolean;
  onClose: () => void;
  profileName: string;
  profileSubtitle?: string;
  profileEmoji?: string;
  items: DrawerItem[];
}

export function Drawer({
  visible,
  onClose,
  profileName,
  profileSubtitle,
  profileEmoji = '🐶',
  items,
}: DrawerProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <OverlayBackdrop onPress={onClose} style={styles.backdrop}>
        <Pressable
          style={[
            styles.drawer,
            { paddingTop: insets.top + 36, paddingBottom: insets.bottom + 20 },
          ]}
          onPress={(event) => event.stopPropagation()}
        >
          <Pressable style={[styles.closeBtn, { top: insets.top + 14 }]} onPress={onClose} hitSlop={8}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>

          <View style={styles.profile}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>{profileEmoji}</Text>
            </View>
            <View style={styles.profileText}>
              <Text style={styles.profileName}>{profileName}</Text>
              {profileSubtitle ? <Text style={styles.profileSub}>{profileSubtitle}</Text> : null}
            </View>
          </View>

          {items.map((item) => (
            <Pressable
              key={item.label}
              style={[styles.item, item.danger && styles.itemDanger]}
              onPress={() => {
                onClose();
                item.onPress();
              }}
            >
              <Text style={styles.itemIcon}>{item.icon}</Text>
              <Text style={[styles.itemLabel, item.danger && styles.itemLabelDanger]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </Pressable>
      </OverlayBackdrop>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    justifyContent: 'flex-start',
  },
  drawer: {
    width: '76%',
    height: '100%',
    backgroundColor: colors.white,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 10, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 15,
    elevation: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeText: {
    fontSize: 12,
    color: colors.ink,
    fontWeight: '700',
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingBottom: 16,
    marginBottom: 8,
    marginTop: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.apricot,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.ink,
  },
  profileSub: {
    fontSize: 10.5,
    color: colors.grey,
    marginTop: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 4,
  },
  itemDanger: {
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingTop: 16,
  },
  itemIcon: {
    fontSize: 15,
    width: 20,
    textAlign: 'center',
  },
  itemLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.ink,
  },
  itemLabelDanger: {
    color: colors.danger,
  },
});
