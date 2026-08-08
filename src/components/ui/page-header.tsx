import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";

/**
 * The masthead every screen opens with: an oversized uppercase title that
 * rises into place behind a mask, annotated by a monospaced meta line and
 * closed by a full-width rule.
 */
export function PageHeader({
  title,
  subtitle,
  cycleName,
  role,
  actions,
  index,
}: {
  title: string;
  subtitle?: string;
  cycleName?: string;
  role?: string;
  actions?: ReactNode;
  /** Optional [NN] index shown before the meta line. */
  index?: number;
}) {
  const meta = [
    index !== undefined ? `[${String(index).padStart(2, "0")}]` : null,
    role,
    cycleName,
  ].filter(Boolean);

  return (
    <header className="border-border mb-8 border-b pb-6">
      {meta.length > 0 && (
        <div className="label-xs text-ink-tertiary mb-4 flex flex-wrap items-center gap-3">
          {meta.map((item, i) => (
            <span key={i} className="flex items-center gap-3">
              {i > 0 && <span className="text-primary">✳</span>}
              {item}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0 flex-1">
          {/* Mount-triggered, not scroll-triggered: the masthead is always
              above the fold, and a mask that never lifts is an invisible page
              title. */}
          <Reveal mode="mount">
            <h1 className="display text-4xl sm:text-5xl lg:text-6xl">{title}</h1>
          </Reveal>
          {subtitle && (
            <p className="text-ink-secondary mt-4 max-w-2xl text-sm leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap gap-2 pb-1">{actions}</div>
        )}
      </div>
    </header>
  );
}
