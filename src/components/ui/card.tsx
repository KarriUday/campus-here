import type { HTMLAttributes, ReactNode } from "react";
import { Counter } from "@/components/motion/counter";
import { cn } from "@/lib/utils";

/**
 * A "card" here is a ruled panel, not a floating box: a hairline border, no
 * rounding, no shadow. Grouping comes from the rule and the whitespace.
 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border-border-subtle bg-surface-raised border", className)}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border-subtle flex flex-wrap items-start justify-between gap-4 border-b px-5 py-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-ink text-sm font-semibold tracking-tight uppercase">
          {title}
        </h2>
        {subtitle && (
          <p className="text-ink-secondary mt-1 max-w-2xl text-sm leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

/**
 * The headline figure. An oversized monospaced numeral over a tiny caps
 * label, counting up as it scrolls into view.
 */
export function StatCard({
  label,
  value,
  meta,
  tone = "neutral",
  index,
}: {
  label: string;
  value: ReactNode;
  meta?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "error";
  /** Optional [NN] index for the grid position. */
  index?: number;
}) {
  const accent =
    tone === "warning" || tone === "error" ? "text-primary" : "text-ink";

  return (
    <div className="border-border-subtle group relative border-t pt-4">
      <div className="flex items-baseline justify-between">
        <span className="label-xs text-ink-tertiary">
          {index !== undefined ? `[${String(index).padStart(2, "0")}] ` : ""}
          {label}
        </span>
        {tone !== "neutral" && (
          <span
            className={cn(
              "size-1.5 shrink-0",
              tone === "success" && "bg-success",
              tone === "warning" && "bg-primary",
              tone === "error" && "bg-primary",
              tone === "info" && "bg-ink",
            )}
            aria-hidden
          />
        )}
      </div>

      <p className={cn("numeral mt-3 text-5xl font-medium", accent)}>
        {typeof value === "number" || typeof value === "string" ? (
          <Counter value={value} />
        ) : (
          value
        )}
      </p>

      {meta && (
        <p className="text-ink-tertiary mt-2 text-xs leading-snug">{meta}</p>
      )}
    </div>
  );
}
