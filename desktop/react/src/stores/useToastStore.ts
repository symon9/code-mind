import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: Toast[];
}

interface ToastActions {
  addToast: (message: string, type?: ToastType) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

type ToastStore = ToastState & ToastActions;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newToast: Toast = { id, message, type };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 3000);

    return id;
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },
}));
