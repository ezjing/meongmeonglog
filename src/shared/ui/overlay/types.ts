import type React from 'react';

/**
 * success: 저장·완료 (초록)
 * warning: 사용법 안내, 입력값 확인, 권한 필요, 준비 중 (주황)
 * error: 요청 실패 — 서버·네트워크 오류 (빨강)
 */
export type ToastVariant = 'success' | 'warning' | 'error';

export interface AlertDialogOptions {
  icon?: string;
  title: string;
  message?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  destructive?: boolean;
}

export interface ToastOptions {
  message: string;
  variant: ToastVariant;
  duration?: number;
}

export interface BottomSheetOption {
  icon?: React.ReactNode;
  iconBg?: string;
  label: string;
  onPress: () => void;
}
