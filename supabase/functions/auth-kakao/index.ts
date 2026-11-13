import { externalApiSignal } from '../_shared/http.ts';
import { serveSocialAuth, type SocialProfile } from '../_shared/socialAuth.ts';

/** 카카오디벨로퍼스 멍멍로그 앱 ID — 다른 앱에서 발급된 토큰 차단용 */
const KAKAO_APP_ID = 1496855;

async function fetchKakaoProfile(accessToken: string): Promise<SocialProfile> {
  const headers = { Authorization: `Bearer ${accessToken}` };

  const tokenInfoRes = await fetch('https://kapi.kakao.com/v1/user/access_token_info', {
    headers,
    signal: externalApiSignal(),
  });
  if (!tokenInfoRes.ok) throw new Error('Invalid Kakao token');
  const tokenInfo = await tokenInfoRes.json();
  if (tokenInfo.app_id !== KAKAO_APP_ID) throw new Error('Invalid Kakao token');

  const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers,
    signal: externalApiSignal(),
  });
  if (!userRes.ok) throw new Error('Invalid Kakao token');
  const kakaoUser = await userRes.json();
  if (!kakaoUser.id || kakaoUser.id !== tokenInfo.id) throw new Error('Invalid Kakao token');

  const account = kakaoUser.kakao_account;
  const isEmailVerified = account?.is_email_valid === true && account?.is_email_verified === true;

  return {
    provider: 'kakao',
    providerUserId: String(kakaoUser.id),
    email: isEmailVerified ? (account?.email ?? null) : null,
    nickname: account?.profile?.nickname ?? kakaoUser.properties?.nickname ?? '카카오 사용자',
    profileImage: account?.profile?.profile_image_url ?? null,
  };
}

serveSocialAuth('kakao', fetchKakaoProfile);
