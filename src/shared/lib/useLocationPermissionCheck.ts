import { useCallback } from 'react';

import { useOverlay } from '@/shared/ui/overlay';

import { requestWalkLocationPermissions } from './locationPermission';

/** 산책 기록 권한을 요청하고 결과를 토스트로 알려준다 (설정 화면·드로어) */
export function useLocationPermissionCheck() {
  const { showToast } = useOverlay();

  return useCallback(async () => {
    const granted = await requestWalkLocationPermissions();
    showToast({
      message: granted ? '📍 위치 권한이 허용되었어요' : '⚠️ 설정에서 위치 권한을 허용해주세요',
      variant: granted ? 'success' : 'warning',
    });
  }, [showToast]);
}
