export type ToastVariant = 'default' | 'success' | 'warning';

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
  variant?: ToastVariant;
  duration?: number;
}

export interface BottomSheetOption {
  icon: string;
  label: string;
  onPress: () => void;
}
