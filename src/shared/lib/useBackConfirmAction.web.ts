import { useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

/**
 * 웹: 하드웨어 뒤로가기(BackHandler)는 없지만, 앱 안의 뒤로가기·브라우저 뒤로가기로
 * 화면이 닫힐 때(beforeRemove)는 네이티브와 같이 확인을 거친다.
 */
export function useBackConfirmAction(onBack: () => void | Promise<void>, enabled = true) {
  const navigation = useNavigation();
  const allowLeaveRef = useRef(false);
  const onBackRef = useRef(onBack);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    onBackRef.current = onBack;
    enabledRef.current = enabled;
  });

  useFocusEffect(
    useCallback(() => {
      allowLeaveRef.current = false;

      return navigation.addListener('beforeRemove', (event) => {
        if (allowLeaveRef.current) return;
        if (!enabledRef.current) return;
        event.preventDefault();
        void onBackRef.current();
      });
    }, [navigation]),
  );

  const allowLeave = useCallback(() => {
    allowLeaveRef.current = true;
  }, []);

  return { allowLeave };
}
