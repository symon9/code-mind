import React from 'react';
import { useToastStore, type ToastType } from '../../stores/useToastStore';

const getToastStyles = (type: ToastType) => {
  switch (type) {
    case 'success':
      return {
        bg: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200',
        iconBg: 'bg-emerald-500/20 text-emerald-400',
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
      };
    case 'error':
      return {
        bg: 'bg-rose-950/90 border-rose-500/40 text-rose-200',
        iconBg: 'bg-rose-500/20 text-rose-400',
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
      };
    case 'info':
    default:
      return {
        bg: 'bg-surface-300/95 border-accent/40 text-text-primary',
        iconBg: 'bg-accent/20 text-accent-light',
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      };
  }
};

export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const style = getToastStyles(toast.type);
        return (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border
              shadow-lg backdrop-blur-md transition-all duration-200 animate-slide-in-right text-xs font-medium
              ${style.bg}
            `}
          >
            <div className="flex items-center gap-2.5">
              <span className={`p-1 rounded-md shrink-0 ${style.iconBg}`}>
                {style.icon}
              </span>
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded text-text-muted hover:text-text-primary transition-colors shrink-0"
              title="Dismiss"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
};
