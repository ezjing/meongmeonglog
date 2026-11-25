import { router } from 'expo-router';

/** 앱 안에서 연 공유 일기: 첫 화면이 로그인 여부에 따라 로그인 또는 홈으로 보낸다 */
export function startMeongmeonglog() {
  router.replace('/');
}
