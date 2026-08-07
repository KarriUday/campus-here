import type { ReactNode } from "react";
import { Badge } from "./badge";

/**
 * Standard screen heading. Every route renders one, so the title, subtitle and
 * cycle context sit in the same place on all 30 screens.
 */
export function PageHeader({
  title,
  subtitle,
  cycleName,
  role,
  actions,
}: {
  title: string;
  subtitle?: string;
  cycleName?: string;
  role?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-ink text-xl font-semibold tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-ink-secondary mt-1 text-sm">{subtitle}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {cycleName && <Badge tone="neutral">{cycleName}</Badge>}
        {role && <Badge tone="info">{role}</Badge>}
        {actions}
      </div>
    </div>
  );
}
