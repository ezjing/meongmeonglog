import { useRef, useState } from 'react';

import { stopWalkTracking, useStartWalk, useWalkStore } from '@/entities/walk';
import { requestWalkLocationPermissions } from '@/shared/lib/locationPermission';

import { acquireWebWalkWakeLock, releaseWebWalkWakeLock } from '../lib/webWakeLock';
import { primeWebWalkGeolocation, releaseWebWalkGeolocation } from '../lib/webWalkGeolocation';

export type StartWalkResult = 'started' | 'permission_denied' | 'failed' | 'busy';

/**
 * 웹: 위치 권한 창·화면 꺼짐 방지는 탭 직후에만 요청할 수 있어 탭 처리 안에서 바로 켠다.
 * (네이티브는 아무 일도 하지 않음)
 */
function primeWebWalkSession() {
  primeWebWalkGeolocation();
  acquireWebWalkWakeLock();
}

function releaseWebWalkSession() {
  releaseWebWalkGeolocation();
  releaseWebWalkWakeLock();
}

/** 진행 중인 산책 화면으로 돌아갈 때 (탭 처리 안에서 호출) */
export function resumeWalkSession() {
  primeWebWalkSession();
}

/**
 * 산책 시작: 위치 권한 → 이전 추적 정리 → 서버에 산책 생성 → 진행 중 산책으로 저장.
 * 화면 이동·안내는 호출한 쪽에서 결과를 보고 한다. 반드시 탭 처리 안에서 바로 호출한다.
 */
export function useStartWalkSession() {
  const startWalk = useStartWalk();
  const startingRef = useRef(false);
  const [isStarting, setIsStarting] = useState(false);

  const start = async (dogId: string): Promise<StartWalkResult> => {
    if (startingRef.current) return 'busy';

    primeWebWalkSession();
    startingRef.current = true;
    setIsStarting(true);
    try {
      const granted = await requestWalkLocationPermissions();
      if (!granted) {
        releaseWebWalkSession();
        return 'permission_denied';
      }

      await stopWalkTracking();
      useWalkStore.getState().reset();

      // 날씨는 산책 화면에서 GPS로 조회해 채운다. 여기서 위치를 기다리면 GPS가 잡히지 않을 때 로딩이 끝나지 않는다
      try {
        const walk = await startWalk.mutateAsync({ dogId });
        useWalkStore.getState().setActiveWalk(walk);
        return 'started';
      } catch {
        releaseWebWalkSession();
        return 'failed';
      }
    } finally {
      startingRef.current = false;
      setIsStarting(false);
    }
  };

  return { start, isStarting };
}
