import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Mirrors the prototype's five `pill()` tones. */
export type BadgeTone = "neutral" | "info" | "success" | "warning" | "error";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface text-ink-secondary ring-border",
  info: "bg-info-soft text-info-ink ring-info-soft",
  success: "bg-success-soft text-success-ink ring-success-soft",
  warning: "bg-warning-soft text-warning-ink ring-warning-soft",
  error: "bg-error-soft text-error-ink ring-error-soft",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
