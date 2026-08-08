import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Emptiness stated plainly in type rather than dressed up with an
 * illustration — the asterisk is the reference's footnote motif.
 */
export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border-subtle flex flex-col items-start border-t py-12",
        className,
      )}
    >
      <span className="text-primary label-xs mb-3" aria-hidden>
        {icon ?? "[ ✳ ]"}
      </span>
      <p className="display text-ink text-xl">{title}</p>
      {description && (
        <p className="text-ink-secondary mt-3 max-w-md text-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
