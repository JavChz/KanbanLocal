import { create } from 'zustand';

export interface ToastItem {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (message: string, options?: Omit<ToastItem, 'id' | 'message'>) => string;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, options) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);
    const duration = options?.duration ?? 3500;

    const newToast: ToastItem = {
      id,
      message,
      type: options?.type || 'info',
      action: options?.action,
      duration,
    };

    set((state) => ({
      toasts: [...state.toasts.slice(-4), newToast], // Keep at most 5 toasts
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }

    return id;
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

export const toast = {
  info: (message: string, options?: Omit<ToastItem, 'id' | 'message' | 'type'>) =>
    useToastStore.getState().addToast(message, { ...options, type: 'info' }),
  success: (message: string, options?: Omit<ToastItem, 'id' | 'message' | 'type'>) =>
    useToastStore.getState().addToast(message, { ...options, type: 'success' }),
  warning: (message: string, options?: Omit<ToastItem, 'id' | 'message' | 'type'>) =>
    useToastStore.getState().addToast(message, { ...options, type: 'warning' }),
  error: (message: string, options?: Omit<ToastItem, 'id' | 'message' | 'type'>) =>
    useToastStore.getState().addToast(message, { ...options, type: 'error' }),
};
