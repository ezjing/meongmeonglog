import NaverLogin from '@react-native-seoul/naver-login';
import { Platform } from 'react-native';

import { NAVER_URL_SCHEME } from '@/constants/naver';

const DEV_AUTH = process.env.EXPO_PUBLIC_DEV_AUTH === 'true';
const NAVER_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID ?? '';
const NAVER_CLIENT_SECRET = process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET ?? '';

let sdkInitialized = false;

function assertNaverConfig() {
  if (!NAVER_CLIENT_ID || NAVER_CLIENT_ID === 'your-naver-client-id') {
    throw new Error('EXPO_PUBLIC_NAVER_CLIENT_ID를 설정해주세요.');
  }
  if (!NAVER_CLIENT_SECRET || NAVER_CLIENT_SECRET === 'your-naver-client-secret') {
    throw new Error('EXPO_PUBLIC_NAVER_CLIENT_SECRET를 설정해주세요.');
  }
  if (!NAVER_URL_SCHEME) {
    throw new Error('네이버 URL Scheme을 생성할 수 없습니다.');
  }
}

export function initNaverSdk() {
  if (sdkInitialized || Platform.OS === 'web') return;
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) return;

  NaverLogin.initialize({
    appName: '멍멍로그',
    consumerKey: NAVER_CLIENT_ID,
    consumerSecret: NAVER_CLIENT_SECRET,
    serviceUrlSchemeIOS: NAVER_URL_SCHEME,
    disableNaverAppAuthIOS: false,
  });
  sdkInitialized = true;
}

export async function getNaverAccessToken(): Promise<string> {
  if (DEV_AUTH) return 'dev';

  if (Platform.OS === 'web') {
    throw new Error('네이버 로그인은 모바일 앱에서만 지원됩니다.');
  }

  assertNaverConfig();
  initNaverSdk();

  try {
    const { isSuccess, successResponse, failureResponse } = await NaverLogin.login();

    if (!isSuccess || !successResponse?.accessToken) {
      if (failureResponse?.isCancel) {
        throw new Error('로그인이 취소되었습니다.');
      }
      throw new Error(failureResponse?.message ?? '네이버 로그인에 실패했습니다.');
    }

    return successResponse.accessToken;
  } catch (error) {
    if (error instanceof Error && error.message.includes("doesn't seem to be linked")) {
      throw new Error('Dev Client로 앱을 빌드해주세요. (npx expo run:ios 또는 run:android)');
    }
    throw error;
  }
}
