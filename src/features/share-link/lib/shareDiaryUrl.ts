import { Platform, Share } from 'react-native';

import { WEB_ORIGIN } from '@/shared/config/links';
import { copyText } from '@/shared/lib/copyText';

export function shareDiaryUrl(token: string): string {
  const origin =
    Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : WEB_ORIGIN;
  return `${origin}/s/${token}`;
}

/** 시스템 공유 시트를 연다. 시트가 없으면 링크를 복사하고 true를 돌려준다. */
export async function presentDiaryShare(url: string): Promise<'shared' | 'copied'> {
  if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: '멍멍로그 산책 일기', url });
        return 'shared';
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return 'shared';
      }
    }
    await copyText(url);
    return 'copied';
  }

  // iOS는 url, Android는 message만 쓴다 (둘 다 넘기면 일부 앱에서 링크가 두 번 붙음)
  await Share.share(Platform.OS === 'ios' ? { url } : { message: url });
  return 'shared';
}

/**
 * 웹: 주소가 아직 준비되지 않았을 때(처음 공유) 쓴다. Safari는 탭 직후에만 클립보드를 허용하므로,
 * 탭 처리 안에서 바로 복사를 예약하고 주소는 나중에 채운다(ClipboardItem에 Promise 전달).
 */
export async function copyDiaryUrlWhenReady(urlPromise: Promise<string>): Promise<'copied'> {
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/plain': urlPromise.then((url) => new Blob([url], { type: 'text/plain' })),
      }),
    ]);
    return 'copied';
  }
  await navigator.clipboard.writeText(await urlPromise);
  return 'copied';
}
