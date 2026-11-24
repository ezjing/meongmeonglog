const HANGUL_SYLLABLE_START = 0xac00;
const HANGUL_SYLLABLE_END = 0xd7a3;
const HANGUL_JONGSEONG_COUNT = 28;

/** 끝 글자에 받침이 있으면 true. 한글 음절이 아니면 false. */
function hasBatchim(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length === 0) return false;
  const code = trimmed.charCodeAt(trimmed.length - 1);
  if (code < HANGUL_SYLLABLE_START || code > HANGUL_SYLLABLE_END) return false;
  return (code - HANGUL_SYLLABLE_START) % HANGUL_JONGSEONG_COUNT !== 0;
}

/**
 * 이름 끝 글자에 받침이 있으면 `withBatchim`, 없으면 `withoutBatchim`.
 * 한글이 아니면 받침이 없는 쪽을 쓴다.
 */
export function josa(name: string, withBatchim: string, withoutBatchim: string): string {
  return hasBatchim(name) ? withBatchim : withoutBatchim;
}
