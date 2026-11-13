import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AlertDialog } from './AlertDialog';
import { ToastView } from './Toast';
import type { AlertDialogOptions, ToastOptions } from './types';

interface AlertState extends AlertDialogOptions {
  resolve: (confirmed: boolean) => void;
}

interface OverlayContextValue {
  showAlert: (options: AlertDialogOptions) => Promise<boolean>;
  showToast: (options: ToastOptions) => void;
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

export function OverlayProvider({ children }: { children: React.ReactNode }) {
  const [alertState, setAlertState] = useState<AlertState | null>(null);
  const [toastState, setToastState] = useState<(ToastOptions & { id: number }) | null>(null);
  // 토스트마다 새 key를 줘서 연달아 띄워도 등장 애니메이션과 타이머가 새로 시작되게 한다
  const toastIdRef = useRef(0);

  const showAlert = useCallback((options: AlertDialogOptions) => {
    return new Promise<boolean>((resolve) => {
      setAlertState({ ...options, resolve });
    });
  }, []);

  const showToast = useCallback((options: ToastOptions) => {
    toastIdRef.current += 1;
    setToastState({ ...options, id: toastIdRef.current });
  }, []);

  const closeAlert = useCallback((confirmed: boolean) => {
    setAlertState((current) => {
      current?.resolve(confirmed);
      return null;
    });
  }, []);

  const value = useMemo(() => ({ showAlert, showToast }), [showAlert, showToast]);

  return (
    <OverlayContext.Provider value={value}>
      {children}
      {alertState ? (
        <AlertDialog
          visible
          icon={alertState.icon}
          title={alertState.title}
          message={alertState.message}
          cancelLabel={alertState.cancelLabel}
          confirmLabel={alertState.confirmLabel}
          destructive={alertState.destructive}
          onCancel={() => closeAlert(false)}
          onConfirm={() => closeAlert(true)}
        />
      ) : null}
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        {toastState ? (
          <ToastView
            key={toastState.id}
            message={toastState.message}
            variant={toastState.variant}
            duration={toastState.duration}
            onHide={() => setToastState(null)}
          />
        ) : null}
      </View>
    </OverlayContext.Provider>
  );
}

export function useOverlay() {
  const context = useContext(OverlayContext);
  if (!context) {
    throw new Error('useOverlay must be used within OverlayProvider');
  }
  return context;
}
