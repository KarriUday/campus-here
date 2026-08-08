import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Five tones, carried over from the prototype's `pill()` semantics. */
export type BadgeTone = "neutral" | "info" | "success" | "warning" | "error";

/**
 * Square, uppercase, hairline. Only error and warning take the hot accent, so
 * a page full of neutral badges stays quiet and a real problem shouts.
 */
const TONES: Record<BadgeTone, string> = {
  neutral: "border-border-subtle text-ink-secondary",
  info: "border-ink text-ink",
  success: "border-success text-success",
  warning: "border-primary text-primary",
  error: "border-primary bg-primary text-white",
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
        "label-xs inline-flex items-center border px-2 py-1 font-medium",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
