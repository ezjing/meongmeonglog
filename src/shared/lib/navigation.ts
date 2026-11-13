import { router } from 'expo-router';

/** 딥링크로 바로 진입해 돌아갈 화면이 없으면 홈으로 보낸다 */
export function goBackOrHome() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.dismissTo('/(tabs)');
  }
}
