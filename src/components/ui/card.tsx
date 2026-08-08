import type { HTMLAttributes, ReactNode } from "react";
import { Counter } from "@/components/motion/counter";
import { cn } from "@/lib/utils";

/**
 * A soft white panel floating on the cream ground — generous radius, a very
 * low shadow, no visible border unless the content needs one.
 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-surface-raised shadow-card rounded-2xl",
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
        "flex flex-wrap items-start justify-between gap-4 px-6 pt-6 pb-2",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="display text-ink text-xl">{title}</h2>
        {subtitle && (
          <p className="text-ink-secondary mt-2 max-w-2xl text-sm leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6", className)} {...props} />;
}

/**
 * The headline figure, set on its own colour field. The tone chooses the
 * ground, so a dashboard reads as a row of colour blocks before any number
 * is parsed.
 */
const STAT_FIELDS: Record<string, string> = {
  neutral: "bg-surface-raised text-ink",
  info: "bg-sky text-white",
  success: "bg-lime text-ink",
  warning: "bg-sun text-ink",
  error: "bg-coral text-white",
};

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
  /** Accepted for call-site compatibility; the colour field replaces it. */
  index?: number;
}) {
  const onColour = tone !== "neutral";

  return (
    <div
      className={cn(
        "shadow-card flex min-h-40 flex-col justify-between rounded-2xl p-6",
        STAT_FIELDS[tone],
      )}
    >
      <span
        className={cn(
          "label-xs",
          onColour ? "opacity-80" : "text-ink-tertiary",
        )}
      >
        {label}
      </span>

      <div>
        <p className="numeral mt-6 text-5xl">
          {typeof value === "number" || typeof value === "string" ? (
            <Counter value={value} />
          ) : (
            value
          )}
        </p>
        {meta && (
          <p
            className={cn(
              "mt-2 text-xs leading-snug",
              onColour ? "opacity-80" : "text-ink-tertiary",
            )}
          >
            {meta}
          </p>
        )}
      </div>
    </div>
  );
}
