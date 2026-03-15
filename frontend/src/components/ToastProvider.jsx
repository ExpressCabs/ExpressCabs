import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const ToastContext = createContext(null);

const DEFAULT_DURATIONS = {
  success: 4000,
  info: 4000,
  error: 5500,
};

const MAX_VISIBLE_TOASTS = 4;

let externalToastBridge = null;

function normalizeToastInput(type, message, options = {}) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    message,
    duration: typeof options.duration === 'number' ? options.duration : DEFAULT_DURATIONS[type] || 4000,
  };
}

function dispatchExternalToast(type, message, options) {
  if (!externalToastBridge) {
    return false;
  }

  externalToastBridge(type, message, options);
  return true;
}

export const toast = {
  success(message, options) {
    return dispatchExternalToast('success', message, options);
  },
  error(message, options) {
    return dispatchExternalToast('error', message, options);
  },
  info(message, options) {
    return dispatchExternalToast('info', message, options);
  },
};

function ToastCard({ toastItem, onClose }) {
  const toneClasses =
    toastItem.type === 'success'
      ? 'border-emerald-200/80 bg-emerald-50/95 text-emerald-950'
      : toastItem.type === 'error'
      ? 'border-rose-200/90 bg-rose-50/95 text-rose-950'
      : 'border-slate-200/90 bg-white/95 text-slate-900';

  const accentClasses =
    toastItem.type === 'success'
      ? 'bg-emerald-500'
      : toastItem.type === 'error'
      ? 'bg-rose-500'
      : 'bg-sky-500';

  const label =
    toastItem.type === 'success'
      ? 'Success'
      : toastItem.type === 'error'
      ? 'Error'
      : 'Info';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border shadow-[0_16px_40px_-24px_rgba(0,0,0,0.45)] backdrop-blur-xl ${toneClasses}`}
      role="status"
      aria-live="polite"
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${accentClasses}`} />
      <div className="flex items-start gap-3 pl-4 pr-3 py-3.5">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-current/65">{label}</p>
          <p className="mt-1 text-sm font-medium leading-5 text-current">{toastItem.message}</p>
        </div>
        <button
          type="button"
          onClick={() => onClose(toastItem.id)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/5 bg-white/50 text-sm text-current/70 transition hover:bg-white/75 hover:text-current focus:outline-none focus:ring-2 focus:ring-black/10"
          aria-label="Dismiss notification"
        >
          x
        </button>
      </div>
    </motion.div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismissToast = (id) => {
    const timerId = timersRef.current.get(id);
    if (timerId && typeof window !== 'undefined') {
      window.clearTimeout(timerId);
      timersRef.current.delete(id);
    }

    setToasts((current) => current.filter((item) => item.id !== id));
  };

  const pushToast = (type, message, options = {}) => {
    if (!message || typeof window === 'undefined') {
      return null;
    }

    const nextToast = normalizeToastInput(type, message, options);

    setToasts((current) => {
      const nextItems = [nextToast, ...current];
      const overflowItems = nextItems.slice(MAX_VISIBLE_TOASTS);

      overflowItems.forEach((item) => {
        const existingTimerId = timersRef.current.get(item.id);
        if (existingTimerId) {
          window.clearTimeout(existingTimerId);
          timersRef.current.delete(item.id);
        }
      });

      return nextItems.slice(0, MAX_VISIBLE_TOASTS);
    });

    const timeoutId = window.setTimeout(() => {
      dismissToast(nextToast.id);
    }, nextToast.duration);

    timersRef.current.set(nextToast.id, timeoutId);
    return nextToast.id;
  };

  useEffect(() => {
    externalToastBridge = pushToast;

    return () => {
      externalToastBridge = null;
      for (const timeoutId of timersRef.current.values()) {
        window.clearTimeout(timeoutId);
      }
      timersRef.current.clear();
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      dismissToast,
      toast: {
        success: (message, options) => pushToast('success', message, options),
        error: (message, options) => pushToast('error', message, options),
        info: (message, options) => pushToast('info', message, options),
      },
    }),
    []
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[120] px-4 sm:left-auto sm:right-4 sm:w-full sm:max-w-sm">
        <div className="mx-auto flex w-full flex-col gap-3 sm:mx-0">
          <AnimatePresence initial={false}>
            {toasts.map((toastItem) => (
              <ToastCard key={toastItem.id} toastItem={toastItem} onClose={dismissToast} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context.toast;
}
