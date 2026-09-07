import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
    info: (title: string, description?: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, title: string, description?: string, duration = 3600) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastItem = { id, type, title, description, duration };

    setToasts(prev => [...prev.slice(-3), newToast]); // keep max 4 toasts stacked

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (title: string, description?: string) => addToast('success', title, description),
    error: (title: string, description?: string) => addToast('error', title, description),
    info: (title: string, description?: string) => addToast('info', title, description),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Stacked Toast Container */}
      <div 
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
      >
        {toasts.map(t => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all duration-300 transform translate-y-0 animate-fade-in-up ${
                isSuccess
                  ? 'bg-slate-900/95 border-emerald-500/30 text-white shadow-emerald-950/20'
                  : isError
                  ? 'bg-slate-900/95 border-rose-500/30 text-white shadow-rose-950/20'
                  : 'bg-slate-900/95 border-indigo-500/30 text-white shadow-indigo-950/20'
              }`}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {!isSuccess && !isError && <Info className="w-5 h-5 text-indigo-400" />}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-sm font-semibold leading-tight text-white">{t.title}</p>
                {t.description && (
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{t.description}</p>
                )}
              </div>

              {/* Dismiss button */}
              <button
                onClick={() => removeToast(t.id)}
                className="flex-shrink-0 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fail-safe fallback so components never crash if context is temporarily unmounted
    return {
      success: (title: string, desc?: string) => console.log('[Toast success]', title, desc),
      error: (title: string, desc?: string) => console.error('[Toast error]', title, desc),
      info: (title: string, desc?: string) => console.info('[Toast info]', title, desc),
    };
  }
  return context.toast;
};
