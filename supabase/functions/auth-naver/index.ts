import { externalApiSignal } from '../_shared/http.ts';
import { serveSocialAuth, type SocialProfile } from '../_shared/socialAuth.ts';

async function fetchNaverProfile(accessToken: string): Promise<SocialProfile> {
  const profileRes = await fetch('https://openapi.naver.com/v1/nid/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: externalApiSignal(),
  });
  if (!profileRes.ok) throw new Error('Invalid Naver token');

  const profile = await profileRes.json();
  const naverUser = profile.response;
  if (!naverUser?.id) throw new Error('Invalid Naver token');

  return {
    provider: 'naver',
    providerUserId: String(naverUser.id),
    email: naverUser.email ?? null,
    // 실명(name)은 앱에서 쓰지 않으므로 닉네임이 없어도 저장하지 않는다
    nickname: naverUser.nickname ?? '네이버 사용자',
    profileImage: naverUser.profile_image ?? null,
  };
}

serveSocialAuth('naver', fetchNaverProfile);
