import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Five tones, carried over from the prototype's `pill()` semantics. */
export type BadgeTone = "neutral" | "info" | "success" | "warning" | "error";

/**
 * Filled pills. Soft tinted grounds so a table of them stays calm, with the
 * darker -ink variants carrying the text contrast.
 */
const TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface text-ink-secondary",
  info: "bg-info-soft text-info-ink",
  success: "bg-success-soft text-success-ink",
  warning: "bg-warning-soft text-warning-ink",
  error: "bg-error-soft text-error-ink",
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
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
