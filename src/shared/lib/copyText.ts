import { setStringAsync } from 'expo-clipboard';

/** 문자열을 클립보드에 넣는다. 웹도 같은 패키지를 쓴다. */
export async function copyText(text: string): Promise<void> {
  const copied = await setStringAsync(text);
  if (!copied) {
    throw new Error('clipboard copy failed');
  }
}
