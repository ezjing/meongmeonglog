import type { ExpoConfig } from 'expo/config';

import appJson from './app.json';
// 스플래시·아이콘 배경 = 2단계 bg 토큰 값 (Node에서 읽을 수 있게 팔레트 JSON을 직접 참조)
import palette from './src/shared/config/tokens/palette.json';

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

const baseConfig = appJson.expo as ExpoConfig;

// 스플래시·적응형 아이콘 배경을 앱 배경 토큰과 맞춘다
const basePlugins = (baseConfig.plugins ?? []).map((plugin) => {
  if (plugin === 'expo-router') {
    return ['expo-router', { unstable_useServerMiddleware: true }];
  }
  if (Array.isArray(plugin) && plugin[0] === 'expo-splash-screen') {
    return [plugin[0], { ...plugin[1], backgroundColor: palette.cream200 }];
  }
  return plugin;
});

export default (): ExpoConfig => ({
  ...baseConfig,
  web: {
    ...baseConfig.web,
    // 카카오가 /s/{token}을 직접 읽을 때 미리보기 HTML을 내려준다
    output: 'server',
    lang: 'ko',
    name: '멍멍로그',
    shortName: '멍멍로그',
    themeColor: palette.cream200,
    backgroundColor: palette.cream200,
    display: 'standalone',
    barStyle: 'default',
    startUrl: '/',
  },
  android: {
    ...baseConfig.android,
    adaptiveIcon: { ...baseConfig.android?.adaptiveIcon, backgroundColor: palette.cream200 },
  },
  plugins: [
    ...basePlugins,
    'expo-dev-client',
    [
      '@react-native-kakao/core',
      {
        nativeAppKey: process.env.EXPO_PUBLIC_KAKAO_APP_KEY ?? '',
        android: { authCodeHandlerActivity: true },
        ios: { handleKakaoOpenUrl: true },
      },
    ],
    './plugins/withKakaoMaven.js',
    './plugins/withAndroidLocalProperties.js',
    ...(googleMapsApiKey
      ? [['react-native-maps', { androidGoogleMapsApiKey: googleMapsApiKey }]]
      : []),
  ] as NonNullable<ExpoConfig['plugins']>,
});
