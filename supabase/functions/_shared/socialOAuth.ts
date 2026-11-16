/// <reference path="./deno.d.ts" />

import { externalApiSignal } from './http.ts';

const ALLOWED_REDIRECT_URIS = new Set([
  'https://meongmeonglog--preview.expo.app/callback',
  'https://meongmeonglog.expo.app/callback',
]);

export interface SocialAuthCode {
  code: string;
  redirectUri: string;
  state: string;
}

export interface SocialOAuth {
  buildAuthorizeUrl: (input: {
    redirectUri: string;
    state: string;
    forceAccountPicker: boolean;
  }) => string;
  exchangeCode: (input: SocialAuthCode) => Promise<string>;
}

export function assertRedirectUri(redirectUri: string) {
  if (!ALLOWED_REDIRECT_URIS.has(redirectUri)) {
    console.error('[auth] redirect uri rejected');
    throw new Error('로그인에 실패했습니다.');
  }
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    console.error(`[auth] ${name} missing`);
    throw new Error('로그인에 실패했습니다.');
  }
  return value;
}

export function buildKakaoAuthorizeUrl(input: {
  redirectUri: string;
  state: string;
  forceAccountPicker: boolean;
}): string {
  assertRedirectUri(input.redirectUri);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: requireEnv('KAKAO_REST_API_KEY'),
    redirect_uri: input.redirectUri,
    state: input.state,
  });
  if (input.forceAccountPicker) params.set('prompt', 'select_account');
  return `https://kauth.kakao.com/oauth/authorize?${params}`;
}

export async function exchangeKakaoCode(input: SocialAuthCode): Promise<string> {
  assertRedirectUri(input.redirectUri);
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: requireEnv('KAKAO_REST_API_KEY'),
    redirect_uri: input.redirectUri,
    code: input.code,
  });
  const clientSecret = Deno.env.get('KAKAO_CLIENT_SECRET');
  if (clientSecret) body.set('client_secret', clientSecret);

  const response = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: externalApiSignal(),
  });
  if (!response.ok) throw new Error('Invalid Kakao token');
  const token = await response.json();
  if (!token.access_token) throw new Error('Invalid Kakao token');
  return token.access_token as string;
}

export function buildNaverAuthorizeUrl(input: {
  redirectUri: string;
  state: string;
  forceAccountPicker: boolean;
}): string {
  assertRedirectUri(input.redirectUri);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: requireEnv('NAVER_CLIENT_ID'),
    redirect_uri: input.redirectUri,
    state: input.state,
  });
  if (input.forceAccountPicker) params.set('auth_type', 'reauthenticate');
  return `https://nid.naver.com/oauth2.0/authorize?${params}`;
}

export async function exchangeNaverCode(input: SocialAuthCode): Promise<string> {
  assertRedirectUri(input.redirectUri);
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: requireEnv('NAVER_CLIENT_ID'),
    client_secret: requireEnv('NAVER_CLIENT_SECRET'),
    code: input.code,
    state: input.state,
  });

  const response = await fetch('https://nid.naver.com/oauth2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: externalApiSignal(),
  });
  if (!response.ok) throw new Error('Invalid Naver token');
  const token = await response.json();
  if (!token.access_token) throw new Error('Invalid Naver token');
  return token.access_token as string;
}

export function oauthFor(provider: 'kakao' | 'naver'): SocialOAuth {
  if (provider === 'kakao') {
    return { buildAuthorizeUrl: buildKakaoAuthorizeUrl, exchangeCode: exchangeKakaoCode };
  }
  return { buildAuthorizeUrl: buildNaverAuthorizeUrl, exchangeCode: exchangeNaverCode };
}
