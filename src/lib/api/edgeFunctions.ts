import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from '@supabase/supabase-js';

function toUserFriendlyMessage(message: string): string {
  if (message.includes('429') || message.toLowerCase().includes('quota')) {
    return 'OpenAI API 사용 한도를 초과했습니다. OpenAI 결제/크레딧을 확인해주세요.';
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
