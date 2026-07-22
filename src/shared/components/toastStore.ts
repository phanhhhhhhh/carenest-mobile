import { create } from 'zustand';

export type ToastVariant = 'error' | 'success' | 'info';

export interface ToastEntry {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastState {
  toasts: ToastEntry[];
  show: (message: string, variant?: ToastVariant) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (message, variant = 'error') => {
    const id = nextId++;
    set((state) => ({ toasts: [...state.toasts, { id, message, variant }] }));
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/** Convenience for use outside components (stores, services): shows a dismissible error toast. */
export function showErrorToast(message: string): void {
  useToastStore.getState().show(message, 'error');
}

export function showSuccessToast(message: string): void {
  useToastStore.getState().show(message, 'success');
}
