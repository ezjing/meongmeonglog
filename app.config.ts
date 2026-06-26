import type { ExpoConfig } from 'expo/config';

import appJson from './app.json';

const naverClientId = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID ?? '';
const naverUrlScheme = naverClientId ? `naver${naverClientId}` : '';

export default (): ExpoConfig => ({
  ...appJson.expo,
  plugins: [
    ...(appJson.expo.plugins ?? []),
    'expo-dev-client',
    [
      '@react-native-kakao/core',
      {
        nativeAppKey: process.env.EXPO_PUBLIC_KAKAO_APP_KEY ?? '',
        android: { authCodeHandlerActivity: true },
        ios: { handleKakaoOpenUrl: true },
      },
    ],
    [
      '@react-native-seoul/naver-login',
      {
        urlScheme: naverUrlScheme,
      },
    ],
  ],
});
