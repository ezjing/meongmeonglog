import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import {
  INVITE_CODE_LENGTH,
  inviteFailedMessage,
  inviteWarningMessage,
  normalizeInviteCode,
  previewHouseholdInvite,
} from '@/entities/household';
import {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  borderWidth,
  letterSpacing,
} from '@/shared/config/theme';
import { Button } from '@/shared/ui/Button';
import { KeyboardAwareScrollView } from '@/shared/ui/KeyboardAwareScrollView';
import { useOverlay } from '@/shared/ui/overlay';
import { StackAppBar } from '@/shared/ui/StackAppBar';

export function InviteCodeScreen() {
  const [code, setCode] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const { showToast } = useOverlay();
  const normalized = normalizeInviteCode(code);

  const handleConfirm = async () => {
    if (normalized.length !== INVITE_CODE_LENGTH || isChecking) return;
    setIsChecking(true);
    try {
      await previewHouseholdInvite(normalized);
      router.push({ pathname: '/family/confirm', params: { code: normalized } });
    } catch (error) {
      const warning = inviteWarningMessage(error);
      showToast({
        message: warning ?? inviteFailedMessage(error) ?? '초대 정보를 불러오지 못했어요',
        variant: warning ? 'warning' : 'error',
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StackAppBar title="초대 코드 입력" onBackPress={() => router.back()} />
      <KeyboardAwareScrollView contentContainerStyle={styles.content}>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={(text) => setCode(normalizeInviteCode(text).slice(0, INVITE_CODE_LENGTH))}
          placeholder={`${INVITE_CODE_LENGTH}자리 코드`}
          placeholderTextColor={colors.fgSubtle}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={INVITE_CODE_LENGTH}
        />
        <Button
          label="확인"
          onPress={handleConfirm}
          disabled={normalized.length !== INVITE_CODE_LENGTH}
          loading={isChecking}
        />
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md },
  input: {
    backgroundColor: colors.surface,
    borderWidth: borderWidth.medium,
    borderColor: colors.border,
    borderRadius: radius.control,
    padding: spacing.ms,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.fg,
    textAlign: 'center',
    letterSpacing: letterSpacing.wider,
  },
});
