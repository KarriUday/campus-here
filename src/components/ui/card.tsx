import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-border bg-surface-raised shadow-card rounded-2xl border",
        className,
      )}
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
        "flex flex-wrap items-start justify-between gap-3 px-5 pt-5",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-ink text-base font-semibold tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-ink-secondary mt-0.5 text-sm">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

/** Headline number tile used across the three dashboards. */
export function StatCard({
  label,
  value,
  meta,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  meta?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "error";
}) {
  const toneClass = {
    neutral: "bg-surface text-ink-secondary",
    info: "bg-info-soft text-info-ink",
    success: "bg-success-soft text-success-ink",
    warning: "bg-warning-soft text-warning-ink",
    error: "bg-error-soft text-error-ink",
  }[tone];

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-ink-secondary text-sm font-medium">{label}</p>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
            toneClass,
          )}
        >
          {tone === "neutral" ? "info" : tone}
        </span>
      </div>
      <p className="text-ink mono mt-3 text-3xl font-semibold">{value}</p>
      {meta && <p className="text-ink-tertiary mt-1 text-xs">{meta}</p>}
    </Card>
  );
}
