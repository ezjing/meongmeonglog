import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from '@supabase/supabase-js';

const DIARY_UNAVAILABLE_MESSAGE = '지금은 일기를 쓸 수 없어요. 잠시 후 다시 시도해 주세요.';

function toUserFriendlyMessage(message: string): string {
  if (
    message.includes('429') ||
    message.toLowerCase().includes('quota') ||
    message.includes('GROQ_API_KEY')
  ) {
    return DIARY_UNAVAILABLE_MESSAGE;
  }
  if (message.includes('Walk not found')) {
    return '산책 기록을 찾을 수 없습니다.';
  }
  return message;
}

export async function getEdgeFunctionErrorMessage(
  data: unknown,
  error: unknown,
  fallback: string,
): Promise<string> {
  const responseError = (data as { error?: string } | null)?.error;
  if (responseError) return toUserFriendlyMessage(responseError);

  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (
        body &&
        typeof body === 'object' &&
        'error' in body &&
        typeof (body as { error: unknown }).error === 'string'
      ) {
        return toUserFriendlyMessage((body as { error: string }).error);
      }
    } catch {
      try {
        const text = await error.context.text();
        if (text) return toUserFriendlyMessage(text);
      } catch {
        // fall through
      }
    }
  }

  if (error instanceof FunctionsRelayError || error instanceof FunctionsFetchError) {
    return error.message;
  }

  if (error instanceof Error) return toUserFriendlyMessage(error.message);
  return fallback;
}
