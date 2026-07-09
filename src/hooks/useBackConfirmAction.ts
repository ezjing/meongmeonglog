import { useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useRef } from 'react';
import { BackHandler } from 'react-native';

export function useBackConfirmAction(onBack: () => void | Promise<void>, enabled = true) {
  const navigation = useNavigation();
  const allowLeaveRef = useRef(false);
  const onBackRef = useRef(onBack);
  const enabledRef = useRef(enabled);
  onBackRef.current = onBack;
  enabledRef.current = enabled;

  useFocusEffect(
    useCallback(() => {
      allowLeaveRef.current = false;

      const runBackAction = () => {
        if (!enabledRef.current) return;
        void onBackRef.current();
      };

      const backSubscription = BackHandler.addEventListener('hardwareBackPress', () => {
        runBackAction();
        return true;
      });

      const unsubscribeBeforeRemove = navigation.addListener('beforeRemove', (event) => {
        if (allowLeaveRef.current) return;
        if (!enabledRef.current) return;
        event.preventDefault();
        runBackAction();
      });

      return () => {
        backSubscription.remove();
        unsubscribeBeforeRemove();
      };
    }, [navigation]),
  );

  const allowLeave = useCallback(() => {
    allowLeaveRef.current = true;
  }, []);

  return { allowLeave };
}
