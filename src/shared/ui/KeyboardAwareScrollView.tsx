import type { Ref } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, type ScrollViewProps } from 'react-native';

interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  ref?: Ref<ScrollView>;
}

/**
 * 입력칸이 있는 화면용 ScrollView. 키보드가 올라오면 그 높이만큼 아래 여백을 줘서 내용이 가려지지 않게 한다.
 * (Android edge-to-edge에서는 키보드가 화면을 줄이지 않고 덮기 때문에 직접 처리해야 한다)
 * 화면 맨 아래 입력칸은 onFocus에서 ref.scrollToEnd()로 보이게 한다.
 */
export function KeyboardAwareScrollView({ ref, style, ...props }: KeyboardAwareScrollViewProps) {
  return (
    <KeyboardAvoidingView style={styles.fill} behavior="padding">
      <ScrollView ref={ref} style={style} keyboardShouldPersistTaps="handled" {...props} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
