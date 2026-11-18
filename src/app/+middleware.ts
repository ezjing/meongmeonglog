const BOT_PATTERN =
  /kakaotalk|facebookexternalhit|twitterbot|slackbot|telegrambot|whatsapp|discordbot/i;

export const unstable_settings = {
  matcher: {
    methods: ['GET'],
    patterns: ['/s/[token]'],
  },
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export default async function middleware(request: Request): Promise<Response | undefined> {
  const userAgent = request.headers.get('user-agent') ?? '';
  if (!BOT_PATTERN.test(userAgent)) return undefined;

  const token = new URL(request.url).pathname.split('/').at(-1) ?? '';
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
