import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { PROFILE_AVATAR_SIZE, PROFILE_CAMERA_BADGE_SIZE } from '@/shared/config/layout';
import { colors, spacing, radius, fontSize, emojiSize, borderWidth } from '@/shared/config/theme';
import { pickImageFromCamera, pickImageFromLibrary } from '@/shared/lib/pickImage';

import { BottomSheet } from './overlay';

interface ProfilePhotoPickerProps {
  imageUri: string | null | undefined;
  placeholderEmoji: string;
  /** 사진 선택 시트 부제목 (예: "강아지 프로필 사진을 등록해주세요") */
  sheetSubtitle: string;
  onChange: (uri: string) => void;
  /** 카메라 배지 테두리 색. 배경색과 맞춘다 */
  badgeBorderColor?: string;
  style?: ViewStyle;
}

/** 원형 프로필 사진 + 카메라 배지. 누르면 카메라/갤러리 선택 시트를 띄운다 (정사각형으로 자르기) */
export function ProfilePhotoPicker({
  imageUri,
  placeholderEmoji,
  sheetSubtitle,
  onChange,
  badgeBorderColor = colors.surface,
  style,
}: ProfilePhotoPickerProps) {
  const [sheetVisible, setSheetVisible] = useState(false);

  const pick = async (picker: typeof pickImageFromLibrary) => {
    const uris = await picker({ allowsEditing: true, aspect: [1, 1] });
    if (uris?.[0]) onChange(uris[0]);
  };

  return (
    <>
      <Pressable style={[styles.wrap, style]} onPress={() => setSheetVisible(true)}>
        <View style={styles.avatar}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" />
          ) : (
            <Text style={styles.emoji}>{placeholderEmoji}</Text>
          )}
        </View>
        <View style={[styles.badge, { borderColor: badgeBorderColor }]}>
          <Text style={styles.badgeEmoji}>📷</Text>
        </View>
      </Pressable>

      <BottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title="프로필 사진 추가"
        subtitle={sheetSubtitle}
        options={[
          { icon: '📷', label: '카메라로 촬영', onPress: () => pick(pickImageFromCamera) },
          { icon: '🖼️', label: '갤러리에서 선택', onPress: () => pick(pickImageFromLibrary) },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    marginBottom: spacing.md,
    position: 'relative',
  },
  avatar: {
    width: PROFILE_AVATAR_SIZE,
    height: PROFILE_AVATAR_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.surfacePlaceholder,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidth.heavy,
    borderColor: colors.surface,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  emoji: { fontSize: emojiSize.md },
  badge: {
    position: 'absolute',
    right: -spacing.xxs,
    bottom: -spacing.xxs,
    width: PROFILE_CAMERA_BADGE_SIZE,
    height: PROFILE_CAMERA_BADGE_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceInverse,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidth.thick,
  },
  badgeEmoji: { fontSize: fontSize.md },
});
