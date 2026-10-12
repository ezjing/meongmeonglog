import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';
import {
  colors,
  spacing,
  radius,
  fontSize,
  iconSize,
  zIndex,
  fontWeight,
  borderWidth,
  shadows,
  hitSlop,
} from '@/constants/theme';

import { OverlayBackdrop } from './OverlayBackdrop';

const CLOSE_BUTTON_SIZE = 26;
const AVATAR_SIZE = 46;

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
  profileImageUri?: string | null;
  items: DrawerItem[];
}

export function Drawer({
  visible,
  onClose,
  profileName,
  profileSubtitle,
  profileEmoji = '🐶',
  profileImageUri,
  items,
}: DrawerProps) {
  const insets = useSafeAreaInsets();
  const [profilePreviewVisible, setProfilePreviewVisible] = useState(false);

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <OverlayBackdrop onPress={onClose} style={styles.backdrop}>
          <Pressable
            style={[
              styles.drawer,
              { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.ml },
            ]}
            onPress={(event) => event.stopPropagation()}
          >
            <Pressable
              style={[styles.closeBtn, { top: insets.top + spacing.md }]}
              onPress={onClose}
              hitSlop={hitSlop}
            >
              <Text style={styles.closeText}>✕</Text>
            </Pressable>

            <View style={styles.profile}>
              <Pressable style={styles.avatar} onPress={() => setProfilePreviewVisible(true)}>
                {profileImageUri ? (
                  <Image
                    source={{ uri: profileImageUri }}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.avatarEmoji}>{profileEmoji}</Text>
                )}
              </Pressable>
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

      <ImagePreviewModal
        visible={profilePreviewVisible}
        imageUri={profileImageUri}
        placeholderEmoji={profileEmoji}
        onClose={() => setProfilePreviewVisible(false)}
      />
    </>
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
    paddingHorizontal: spacing.ml,
    ...shadows.drawer,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: CLOSE_BUTTON_SIZE,
    height: CLOSE_BUTTON_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: zIndex.base,
  },
  closeText: {
    fontSize: fontSize.md,
    color: colors.ink,
    fontWeight: fontWeight.bold,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.ms,
    paddingBottom: spacing.md,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    borderBottomWidth: borderWidth.hairline,
    borderBottomColor: colors.line,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.apricot,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.full,
  },
  avatarEmoji: {
    fontSize: fontSize.display,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.extrabold,
    color: colors.ink,
  },
  profileSub: {
    fontSize: fontSize.sm,
    color: colors.grey,
    marginTop: spacing.xxs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.ms,
    paddingVertical: spacing.ms,
    paddingHorizontal: spacing.xs,
  },
  itemDanger: {
    marginTop: spacing.sm,
    borderTopWidth: borderWidth.hairline,
    borderTopColor: colors.line,
    paddingTop: spacing.md,
  },
  itemIcon: {
    fontSize: fontSize.lg,
    width: iconSize.lg,
    textAlign: 'center',
  },
  itemLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  itemLabelDanger: {
    color: colors.danger,
  },
});
