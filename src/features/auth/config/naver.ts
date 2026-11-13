const NAVER_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID ?? '';

export const NAVER_URL_SCHEME = NAVER_CLIENT_ID ? `naver${NAVER_CLIENT_ID}` : '';
