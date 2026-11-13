import { useCallback, useRef, type ReactNode, type Ref } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, type ScrollViewProps } from 'react-native';

/** 키보드가 다 올라온 뒤 스크롤하기 위한 지연 */
const SCROLL_AFTER_KEYBOARD_MS = 300;

interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  ref?: Ref<ScrollView>;
  /** 스크롤 영역 아래 고정 영역(다음 버튼 등). 키보드 위로 함께 올라간다 */
  footer?: ReactNode;
}

/**
 * 입력칸이 있는 화면용 ScrollView. 키보드가 올라오면 그 높이만큼 아래 여백을 줘서 내용이 가려지지 않게 한다.
 * (Android edge-to-edge에서는 키보드가 화면을 줄이지 않고 덮기 때문에 직접 처리해야 한다)
 * 아래쪽 입력칸은 useScrollToEndOnFocus의 scrollToEnd를 onFocus에 연결해 보이게 한다.
 */
export function KeyboardAwareScrollView({
  ref,
  footer,
  style,
  ...props
}: KeyboardAwareScrollViewProps) {
  return (
    <KeyboardAvoidingView style={styles.fill} behavior="padding">
      <ScrollView ref={ref} style={style} keyboardShouldPersistTaps="handled" {...props} />
      {footer}
    </KeyboardAvoidingView>
  );
}

/** KeyboardAwareScrollView에 넘길 ref와, 입력칸 onFocus에 연결할 scrollToEnd */
export function useScrollToEndOnFocus() {
  const ref = useRef<ScrollView>(null);
  const scrollToEnd = useCallback(() => {
    setTimeout(() => ref.current?.scrollToEnd({ animated: true }), SCROLL_AFTER_KEYBOARD_MS);
  }, []);
  return { ref, scrollToEnd };
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
