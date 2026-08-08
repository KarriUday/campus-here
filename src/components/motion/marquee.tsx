import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Continuous ticker. The children are rendered twice and the track is
 * translated by exactly -50%, so the loop is seamless.
 */
export function Marquee({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("relative flex overflow-hidden select-none", className)}
      aria-hidden
    >
      <div className="marquee-track flex shrink-0 items-center gap-8 pr-8 whitespace-nowrap">
        {children}
        {children}
      </div>
    </div>
  );
}

/** The separator between marquee items. */
export function MarqueeDot() {
  return <span className="text-primary text-[0.6em] leading-none">✳</span>;
}
