import { useQuery } from '@tanstack/react-query';

import { fetchSharedDiary, shareLinkKeys } from './shareLinkApi';

export function useSharedDiary(token: string) {
  return useQuery({
    queryKey: shareLinkKeys.publicDiary(token),
    queryFn: () => fetchSharedDiary(token),
    enabled: token.length > 0,
  });
}
