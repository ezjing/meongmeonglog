import { Platform } from 'react-native';

import { josa } from '@/shared/lib/josa';

import type { StartWalkResult } from './useStartWalkSession';

/** 산책을 시작하려다 위치 권한을 거절했을 때. 플랫폼별 문구는 그대로 둔다. */
export function walkStartPermissionMessage(): string {
  if (Platform.OS === 'ios') {
    return '산책 기록을 위해 위치 "항상 허용"이 필요해요. 설정에서 권한을 확인해 주세요.';
  }
  if (Platform.OS === 'web') {
    return '산책 기록을 위해 위치 권한을 허용해 주세요.';
  }
  return '산책 기록을 위해 위치(앱 사용 중)와 알림 권한을 허용해 주세요.';
}

/** 산책 화면에서 위치 추적을 켜지 못했을 때. 시작 거절 문구와 다른 문장을 쓴다. */
export function walkTrackingPermissionMessage(): string {
  if (Platform.OS === 'android') {
    return '위치·알림 권한을 허용해야 산책을 기록할 수 있어요.';
  }
  if (Platform.OS === 'web') {
    return '위치 권한을 허용해야 산책을 기록할 수 있어요.';
  }
  return '위치 "항상 허용" 권한이 필요해요.';
}

/** 산책 시작 결과 중 화면에 보여줄 안내. 시작·중복 탭은 안내가 없다. */
export function walkStartFeedback(
  result: StartWalkResult,
): { message: string; variant: 'warning' | 'error' } | null {
  if (result.status === 'permission_denied') {
    return { message: walkStartPermissionMessage(), variant: 'warning' };
  }
  if (result.status === 'in_progress') {
    return {
      message: `${result.dogName}${josa(result.dogName, '은', '는')} 지금 ${result.guardianTitle}님과 산책 중이에요`,
      variant: 'warning',
    };
  }
  if (result.status === 'failed') {
    return { message: '산책을 시작하지 못했어요. 다시 시도해주세요.', variant: 'error' };
  }
  return null;
}
