const BOT_PATTERN =
  /kakaotalk|facebookexternalhit|twitterbot|slackbot|telegrambot|whatsapp|discordbot/i;

export const unstable_settings = {
  matcher: {
    methods: ['GET'],
    patterns: ['/s/[token]', '/callback'],
  },
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

const APP_CALLBACK_URL = 'meongmeonglog://oauth-callback';
const APP_STATE_PATTERN = /^app\.(kakao|naver)\.[0-9a-f]{32}$/;

function redirectToApp(params: Record<string, string>): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${APP_CALLBACK_URL}?${new URLSearchParams(params)}`,
      'cache-control': 'no-store',
    },
  });
}

/**
 * 앱(네이티브)이 브라우저로 시작한 로그인: 인가 코드를 서버에서 암호화한 뒤 앱으로 돌려보낸다.
 * 앱 주소(meongmeonglog://)로는 원래 코드를 보내지 않는다. 웹 로그인은 그대로 /callback 화면이 처리한다.
 */
async function handleAppLoginCallback(url: URL): Promise<Response | undefined> {
  const state = url.searchParams.get('state') ?? '';
  const match = APP_STATE_PATTERN.exec(state);
  if (!match) return undefined;

  const code = url.searchParams.get('code');
  if (!code) return redirectToApp({ state, error: url.searchParams.get('error') ?? 'cancelled' });

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return redirectToApp({ state, error: 'failed' });

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/auth-${match[1]}`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ intent: 'seal', code, state }),
    });
    const data = (await response.json()) as { sealed?: string } | null;
    if (!response.ok || !data?.sealed) return redirectToApp({ state, error: 'failed' });
    return redirectToApp({ state, sealed: data.sealed });
  } catch {
    return redirectToApp({ state, error: 'failed' });
  }
}

export default async function middleware(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);
  if (url.pathname === '/callback') return handleAppLoginCallback(url);

  const userAgent = request.headers.get('user-agent') ?? '';
  if (!BOT_PATTERN.test(userAgent)) return undefined;

  const token = url.pathname.split('/').at(-1) ?? '';
  if (!/^[0-9a-f]{48}$/.test(token)) return undefined;

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return undefined;

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_shared_diary`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ share_token: token }),
    });
    if (!response.ok) return undefined;

    const diary = (await response.json()) as {
      dogName?: string;
      content?: string;
      dailyQuote?: string;
      photos?: { imageUrl?: string }[];
    } | null;
    if (!diary?.dogName || !diary.content) return undefined;

    const title = escapeHtml(`${diary.dogName}의 일기`);
    const description = escapeHtml((diary.dailyQuote || diary.content).slice(0, 80));
    const image = diary.photos?.[0]?.imageUrl;
    const imageTag = image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : '';
    const pageUrl = escapeHtml(request.url);

    return new Response(
      `<!doctype html><html lang="ko"><head><meta charset="utf-8" />
<title>${title}</title>
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:url" content="${pageUrl}" />
${imageTag}
</head><body></body></html>`,
      { headers: { 'content-type': 'text/html; charset=utf-8' } },
    );
  } catch {
    return undefined;
  }
}
