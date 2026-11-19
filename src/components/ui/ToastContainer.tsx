import React from 'react';
import { useToastStore } from '../../store/useToastStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast, pauseToast, resumeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[var(--z-toast)] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            role="alert"
            onMouseEnter={() => pauseToast(toast.id)}
            onMouseLeave={() => resumeToast(toast.id)}
            className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl shadow-lg border backdrop-blur-md bg-white/95 dark:bg-slate-900/95 border-slate-200/90 dark:border-white/10 text-slate-800 dark:text-slate-100 ${
              toast.exiting
                ? 'animate-toast-out pointer-events-none'
                : 'animate-toast-in pointer-events-auto'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {isSuccess && <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />}
              {isError && <AlertCircle size={16} className="text-rose-500 shrink-0" />}
              {isWarning && <AlertCircle size={16} className="text-amber-500 shrink-0" />}
              {!isSuccess && !isError && !isWarning && (
                <Info size={16} className="text-blue-500 shrink-0" />
              )}
              <span className="text-xs sm:text-[13px] font-medium leading-snug truncate">
                {toast.message}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick();
                    dismissToast(toast.id);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900/5 dark:bg-white/10 text-slate-800 dark:text-slate-100 hover:bg-slate-900/10 dark:hover:bg-white/15 transition-colors cursor-pointer"
                >
                  {toast.action.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
