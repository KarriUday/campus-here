import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";

/**
 * The masthead every screen opens with: a large sentence-case title with the
 * last word underscored by the hand-drawn squiggle, over a quiet meta line.
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
  /** Accepted for call-site compatibility; no longer rendered. */
  index?: number;
}) {
  const meta = [role, cycleName].filter(Boolean);

  // Underline only the final word, the way the reference marks one term of a
  // headline rather than the whole line.
  const words = title.trim().split(" ");
  const lead = words.slice(0, -1).join(" ");
  const last = words[words.length - 1];

  return (
    <header className="mb-8">
      {meta.length > 0 && (
        <div className="label-xs text-ink-tertiary mb-4 flex flex-wrap items-center gap-2">
          {meta.map((item, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden>·</span>}
              {item}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0 flex-1">
          {/* The mask sits INSIDE the h1 so its em-based padding resolves
              against the heading's own font-size; outside, it would inherit
              the ambient 16px and clip the glyphs at every breakpoint.
              Mount-triggered, not scroll-triggered: the masthead is always
              above the fold, and a mask that never lifts is an invisible page
              title. */}
          <h1 className="display text-4xl sm:text-5xl lg:text-6xl">
            <Reveal mode="mount">
              {lead && `${lead} `}
              <span className="squiggle">{last}</span>
            </Reveal>
          </h1>
          {subtitle && (
            <p className="text-ink-secondary mt-5 max-w-2xl text-base leading-relaxed">
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
