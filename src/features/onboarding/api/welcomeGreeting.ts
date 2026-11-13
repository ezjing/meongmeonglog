import { useMutation } from '@tanstack/react-query';

import { isSupabaseConfigured, supabase } from '@/shared/api/supabase';

export async function fetchWelcomeGreeting(
  dogName: string,
  personality: string[],
  speechStyle: string | null,
  customSpeechStyle?: string | null,
): Promise<string> {
  if (!isSupabaseConfigured) {
    const traits = personality.slice(0, 2).join('하고 ');
    return `안녕! 나는 ${dogName}야~ ${traits ? `${traits} ` : ''}말투로 매일매일 산책일기 같이 써보자, 멍멍!`;
  }

  const { data, error } = await supabase.functions.invoke('welcome-greeting', {
    body: { dogName, personality, speechStyle, customSpeechStyle },
  });

  if (error) {
    return `안녕! 나는 ${dogName}야~ 오늘부터 매일매일 산책일기 같이 써보자, 멍멍!`;
  }

  return (data as { greeting: string }).greeting;
}

export function useWelcomeGreeting() {
  return useMutation({
    mutationFn: ({
      dogName,
      personality,
      speechStyle,
      customSpeechStyle,
    }: {
      dogName: string;
      personality: string[];
      speechStyle: string | null;
      customSpeechStyle?: string | null;
    }) => fetchWelcomeGreeting(dogName, personality, speechStyle, customSpeechStyle),
  });
}
