import { initializeKakaoSDK } from '@react-native-kakao/core';
import { isKakaoTalkLoginAvailable, login as kakaoLogin } from '@react-native-kakao/user';
import { Platform } from 'react-native';

const DEV_AUTH = process.env.EXPO_PUBLIC_DEV_AUTH === 'true';
const KAKAO_APP_KEY = process.env.EXPO_PUBLIC_KAKAO_APP_KEY ?? '';

let sdkInitialized = false;

function assertKakaoAppKey() {
  if (!KAKAO_APP_KEY || KAKAO_APP_KEY === 'your-kakao-app-key') {
    throw new Error('EXPO_PUBLIC_KAKAO_APP_KEY를 설정해주세요.');
  }
}

export function initKakaoSdk() {
  if (sdkInitialized || Platform.OS === 'web') return;
  if (!KAKAO_APP_KEY || KAKAO_APP_KEY === 'your-kakao-app-key') return;

  initializeKakaoSDK(KAKAO_APP_KEY);
  sdkInitialized = true;
}

export async function getKakaoAccessToken(): Promise<string> {
  if (DEV_AUTH) return 'dev';

  if (Platform.OS === 'web') {
    throw new Error('카카오 로그인은 모바일 앱에서만 지원됩니다.');
  }

  assertKakaoAppKey();
  initKakaoSdk();

  try {
    const canUseKakaoTalk = await isKakaoTalkLoginAvailable();
    const result = canUseKakaoTalk
      ? await kakaoLogin()
      : await kakaoLogin({ useKakaoAccountLogin: true });

    if (!result.accessToken) {
      throw new Error('카카오 accessToken을 받지 못했습니다.');
    }

    return result.accessToken;
  } catch (error) {
    if (error instanceof Error && error.message.includes("doesn't seem to be linked")) {
      throw new Error('Dev Client로 앱을 빌드해주세요. (npx expo run:ios 또는 run:android)');
    }
    throw error;
  }
}
