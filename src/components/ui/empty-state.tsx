import { Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
        "border-border bg-surface/50 flex flex-col items-center rounded-xl border border-dashed px-6 py-10 text-center",
        className,
      )}
    >
      <div className="text-ink-tertiary" aria-hidden>
        {icon ?? <Inbox className="size-6" />}
      </div>
      <p className="text-ink mt-3 text-sm font-medium">{title}</p>
      {description && (
        <p className="text-ink-secondary mt-1 max-w-md text-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
