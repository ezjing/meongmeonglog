import { Platform, Share } from 'react-native';

const PRODUCTION_WEB_ORIGIN = 'https://meongmeonglog.expo.app';

export function shareDiaryUrl(token: string): string {
  const origin =
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.location.origin
      : PRODUCTION_WEB_ORIGIN;
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
    await navigator.clipboard.writeText(url);
    return 'copied';
  }

  await Share.share({ message: url, url });
  return 'shared';
}
