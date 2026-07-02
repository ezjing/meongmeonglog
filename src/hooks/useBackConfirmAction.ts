import { useFocusEffect, useNavigation } from "expo-router";
import { useCallback, useRef } from "react";
import { BackHandler } from "react-native";

export function useBackConfirmAction(
  onBack: () => void | Promise<void>,
  enabled = true,
) {
  const navigation = useNavigation();
  const allowLeaveRef = useRef(false);
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useFocusEffect(
    useCallback(() => {
      allowLeaveRef.current = false;
      if (!enabled) return;

      const runBackAction = () => {
        void onBackRef.current();
      };

      const backSubscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          runBackAction();
          return true;
        },
      );

      const unsubscribeBeforeRemove = navigation.addListener(
        "beforeRemove",
        (event) => {
          if (allowLeaveRef.current) return;
          event.preventDefault();
          runBackAction();
        },
      );

      return () => {
        backSubscription.remove();
        unsubscribeBeforeRemove();
      };
    }, [enabled, navigation]),
  );

  const allowLeave = useCallback(() => {
    allowLeaveRef.current = true;
  }, []);

  return { allowLeave };
}
