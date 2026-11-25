import { router } from 'expo-router';

import { ANDROID_PACKAGE, PLAY_STORE_URL } from '../config/store';

const APP_SCHEME = 'meongmeonglog';

function isAndroid() {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
}

/**
 * 웹에서 받은 공유 일기.
 * - Android: 앱이 있으면 앱을 열고, 없으면 Play 스토어로 (intent 링크의 대체 주소)
 * - iPhone·PC: 웹 첫 화면(로그인). iPhone Safari는 홈 화면 추가 안내가 뜬다 (iOS 앱 없음)
 */
export function startMeongmeonglog() {
  if (isAndroid()) {
    const fallback = encodeURIComponent(PLAY_STORE_URL);
    window.location.href = `intent://#Intent;scheme=${APP_SCHEME};package=${ANDROID_PACKAGE};S.browser_fallback_url=${fallback};end`;
    return;
  }
  router.replace('/');
}
