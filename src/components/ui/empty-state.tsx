import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A soft tinted panel rather than a bare rule, so an empty screen still
 *  looks composed. */
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
        "bg-surface flex flex-col items-start rounded-2xl px-8 py-12",
        className,
      )}
    >
      {icon && (
        <span className="text-ink-tertiary mb-3" aria-hidden>
          {icon}
        </span>
      )}
      <p className="display text-ink text-2xl">{title}</p>
      {description && (
        <p className="text-ink-secondary mt-3 max-w-md text-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
