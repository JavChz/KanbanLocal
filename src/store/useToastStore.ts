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
  exiting?: boolean;
}

interface ToastTimerEntry {
  timeoutId?: number;
  remaining: number;
  startedAt: number;
}

const toastTimers = new Map<string, ToastTimerEntry>();

function clearToastTimer(id: string) {
  const entry = toastTimers.get(id);
  if (entry?.timeoutId !== undefined) {
    window.clearTimeout(entry.timeoutId);
  }
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (message: string, options?: Omit<ToastItem, 'id' | 'message' | 'exiting'>) => string;
  dismissToast: (id: string) => void;
  removeToast: (id: string) => void;
  pauseToast: (id: string) => void;
  resumeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (message, options) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);
    const duration = options?.duration ?? 3800;

    const newToast: ToastItem = {
      id,
      message,
      type: options?.type || 'info',
      action: options?.action,
      duration,
      exiting: false,
    };

    set((state) => ({
      toasts: [...state.toasts.slice(-4), newToast],
    }));

    if (duration > 0) {
      const timeoutId = window.setTimeout(() => {
        get().dismissToast(id);
      }, duration);
      toastTimers.set(id, {
        timeoutId,
        remaining: duration,
        startedAt: Date.now(),
      });
    }

    return id;
  },

  dismissToast: (id) => {
    clearToastTimer(id);
    toastTimers.delete(id);

    const existing = get().toasts.find((t) => t.id === id);
    if (!existing || existing.exiting) return;

    set((state) => ({
      toasts: state.toasts.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    }));

    window.setTimeout(() => {
      get().removeToast(id);
    }, 160);
  },

  removeToast: (id) => {
    clearToastTimer(id);
    toastTimers.delete(id);
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  pauseToast: (id) => {
    const entry = toastTimers.get(id);
    if (!entry || entry.timeoutId === undefined) return;
    window.clearTimeout(entry.timeoutId);
    const elapsed = Date.now() - entry.startedAt;
    toastTimers.set(id, {
      timeoutId: undefined,
      remaining: Math.max(400, entry.remaining - elapsed),
      startedAt: entry.startedAt,
    });
  },

  resumeToast: (id) => {
    const entry = toastTimers.get(id);
    const current = get().toasts.find((t) => t.id === id);
    if (!entry || entry.timeoutId !== undefined || !current || current.exiting) return;
    const timeoutId = window.setTimeout(() => {
      get().dismissToast(id);
    }, entry.remaining);
    toastTimers.set(id, {
      timeoutId,
      remaining: entry.remaining,
      startedAt: Date.now(),
    });
  },
}));

export const toast = {
  info: (message: string, options?: Omit<ToastItem, 'id' | 'message' | 'type' | 'exiting'>) =>
    useToastStore.getState().addToast(message, { ...options, type: 'info' }),
  success: (message: string, options?: Omit<ToastItem, 'id' | 'message' | 'type' | 'exiting'>) =>
    useToastStore.getState().addToast(message, { ...options, type: 'success' }),
  warning: (message: string, options?: Omit<ToastItem, 'id' | 'message' | 'type' | 'exiting'>) =>
    useToastStore.getState().addToast(message, { ...options, type: 'warning' }),
  error: (message: string, options?: Omit<ToastItem, 'id' | 'message' | 'type' | 'exiting'>) =>
    useToastStore.getState().addToast(message, { ...options, type: 'error' }),
};
