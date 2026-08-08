"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
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
 * Replaces the prototype's window.alert(), which carried every success and
 * validation message across all three roles.
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

/** A compact typographic marker; the tone colour carries the meaning. */
const MARK: Record<ToastTone, string> = {
  success: "✓",
  error: "!",
  warning: "!",
  info: "i",
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
      // Errors stay until dismissed; they usually need acting on.
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
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="border-ink bg-bg pointer-events-auto flex w-full max-w-sm items-start gap-3 border p-4"
            >
              <span
                className={cn("label-xs mt-0.5 shrink-0", TONE_CLASSES[t.tone])}
                aria-hidden
              >
                {MARK[t.tone]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-ink text-sm font-semibold uppercase">
                  {t.title}
                </p>
                {t.description && (
                  <p className="text-ink-secondary mt-1 text-sm leading-relaxed break-words">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="text-ink-tertiary hover:text-primary transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="size-4" aria-hidden />
              </button>
            </motion.div>
          ))}
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
