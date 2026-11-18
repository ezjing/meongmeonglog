/// <reference path="./deno.d.ts" />

/**
 * 앱(네이티브)에서 브라우저로 시작하는 소셜 로그인.
 *
 * 1. authorize: 서버가 state(`app.<provider>.<nonce>`)와 appProof(nonce의 서명)를 만들어 앱에만 돌려준다.
 * 2. 웹 /callback(middleware)이 받은 인가 코드를 seal로 암호화해 앱 주소(meongmeonglog://)로 넘긴다.
 *    앱 주소로는 원래 코드가 나가지 않는다.
 * 3. 앱이 sealed + state + appProof를 보내면 서버가 확인한 뒤 코드를 꺼내 토큰으로 교환한다.
 */

const STATE_PREFIX = 'app.';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function requireSecret(): string {
  const value = Deno.env.get('OAUTH_STATE_SECRET');
  if (!value) {
    console.error('[auth] OAUTH_STATE_SECRET missing');
    throw new Error('로그인에 실패했습니다.');
  }
  return value;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function deriveBytes(label: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`${label}:${requireSecret()}`));
  return new Uint8Array(digest);
}

async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    await deriveBytes('proof'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return toHex(new Uint8Array(signature));
}

async function sealKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', await deriveBytes('seal'), 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ]);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function isAppLoginState(state: string | undefined): state is string {
  return typeof state === 'string' && state.startsWith(STATE_PREFIX);
}

function parseState(state: string, provider: string): string {
  const [prefix, stateProvider, nonce] = state.split('.');
  if (`${prefix}.` !== STATE_PREFIX || stateProvider !== provider || !/^[0-9a-f]{32}$/.test(nonce ?? '')) {
    throw new Error('로그인에 실패했습니다.');
  }
  return nonce;
}

export async function createAppLoginState(provider: string) {
  const nonce = toHex(crypto.getRandomValues(new Uint8Array(16)));
  return { state: `${STATE_PREFIX}${provider}.${nonce}`, appProof: await sign(nonce) };
}

export async function sealAppLoginCode(provider: string, state: string, code: string) {
  const nonce = parseState(state, provider);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await sealKey(),
    encoder.encode(JSON.stringify({ nonce, code })),
  );
  return { sealed: `${toBase64Url(iv)}.${toBase64Url(new Uint8Array(cipher))}` };
}

/** 앱이 보낸 값을 확인하고 원래 인가 코드를 돌려준다 */
export async function openAppLoginCode(
  provider: string,
  input: { state: string; sealed?: string; appProof?: string },
): Promise<string> {
  const nonce = parseState(input.state, provider);
  if (!input.appProof || !timingSafeEqual(input.appProof, await sign(nonce))) {
    throw new Error('로그인에 실패했습니다.');
  }

  const [ivPart, cipherPart] = (input.sealed ?? '').split('.');
  if (!ivPart || !cipherPart) throw new Error('로그인에 실패했습니다.');
  try {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64Url(ivPart) },
      await sealKey(),
      fromBase64Url(cipherPart),
    );
    const payload = JSON.parse(decoder.decode(plain)) as { nonce?: string; code?: string };
    if (payload.nonce !== nonce || !payload.code) throw new Error('mismatch');
    return payload.code;
  } catch {
    throw new Error('로그인에 실패했습니다.');
  }
}
