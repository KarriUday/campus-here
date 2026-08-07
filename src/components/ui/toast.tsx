"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

/**
 * Replaces the prototype's `window.alert()`, which was used for every single
 * success and validation message across all three roles.
 */
export type ToastTone = "success" | "error" | "warning" | "info";

type Toast = {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
};

type ToastContextValue = {
  toast: (input: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastTone, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  warning: TriangleAlert,
  info: Info,
};

const TONE_CLASSES: Record<ToastTone, string> = {
  success: "text-success-ink",
  error: "text-error-ink",
  warning: "text-warning-ink",
  info: "text-info-ink",
};

const AUTO_DISMISS_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: Omit<Toast, "id">) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { ...input, id }]);
      // Errors stay until dismissed; they usually need to be acted on.
      if (input.tone !== "error") {
        setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      }
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const Icon = ICONS[t.tone];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="border-border bg-surface-raised shadow-raised pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-3.5"
              >
                <Icon
                  className={cn("mt-0.5 size-4 shrink-0", TONE_CLASSES[t.tone])}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-ink text-sm font-medium">{t.title}</p>
                  {t.description && (
                    <p className="text-ink-secondary mt-0.5 text-sm break-words">
                      {t.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className="text-ink-tertiary hover:text-ink rounded p-0.5 transition-colors"
                  aria-label="Dismiss notification"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside a <ToastProvider>.");
  }
  return context;
}
