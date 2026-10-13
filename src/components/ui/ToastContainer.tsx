import React from 'react';
import { useToastStore } from '../../store/useToastStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            role="alert"
            className="pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 animate-slide-up bg-white/95 dark:bg-slate-900/95 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {isSuccess && <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />}
              {isError && <AlertCircle size={18} className="text-rose-500 shrink-0" />}
              {isWarning && <AlertCircle size={18} className="text-amber-500 shrink-0" />}
              {!isSuccess && !isError && !isWarning && (
                <Info size={18} className="text-blue-500 shrink-0" />
              )}
              <span className="text-xs sm:text-sm font-medium leading-snug truncate">
                {toast.message}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {toast.action && (
                <button
                  onClick={() => {
                    toast.action?.onClick();
                    removeToast(toast.id);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-600/20 dark:hover:bg-blue-500/30 transition-colors cursor-pointer"
                >
                  {toast.action.label}
                </button>
              )}
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
