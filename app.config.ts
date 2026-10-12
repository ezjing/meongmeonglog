import type { ExpoConfig } from 'expo/config';

import appJson from './app.json';
import colors from './src/constants/colors.json';

const naverClientId = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID ?? '';
const naverUrlScheme = naverClientId ? `naver${naverClientId}` : '';
const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

const baseConfig = appJson.expo as ExpoConfig;

// 스플래시·적응형 아이콘 배경을 앱 배경 토큰과 맞춘다
const basePlugins = (baseConfig.plugins ?? []).map((plugin) =>
  Array.isArray(plugin) && plugin[0] === 'expo-splash-screen'
    ? [plugin[0], { ...plugin[1], backgroundColor: colors.background }]
    : plugin,
);

export default (): ExpoConfig => ({
  ...baseConfig,
  android: {
    ...baseConfig.android,
    adaptiveIcon: { ...baseConfig.android?.adaptiveIcon, backgroundColor: colors.background },
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
    [
      '@react-native-seoul/naver-login',
      {
        urlScheme: naverUrlScheme,
      },
    ],
    './plugins/withKakaoMaven.js',
    './plugins/withAndroidLocalProperties.js',
    ...(googleMapsApiKey
      ? [['react-native-maps', { androidGoogleMapsApiKey: googleMapsApiKey }]]
      : []),
  ] as NonNullable<ExpoConfig['plugins']>,
});
