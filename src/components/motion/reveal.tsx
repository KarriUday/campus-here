"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Scroll-triggered entrance. Content rises into place behind a clipping mask,
 * which is what gives the reference site its "set in type" feel rather than a
 * plain fade.
 *
 * `mode` matters more than it looks. A masked reveal hides its content until
 * the animation runs, so anything guaranteed to be above the fold — a page
 * title — must animate on mount. Leaving those on `inView` risks an
 * IntersectionObserver that never fires and a permanently invisible heading.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  mode = "inView",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  mode?: "inView" | "mount";
}) {
  const reduced = useReducedMotion();
  if (reduced) return <span className={`block ${className ?? ""}`}>{children}</span>;

  const animation =
    mode === "mount"
      ? { animate: { y: 0 } }
      : { whileInView: { y: 0 }, viewport: { once: true, margin: "-8% 0px" } };

  // The display face is set below its own ink height, and headings may carry
  // the squiggle underline, which paints into its padding. A bare
  // `overflow-hidden` shaves both. Pad the clip box, pull the padding back out
  // of the layout, and start the content low enough that the taller box still
  // hides it.
  return (
    <span
      className={`-my-[0.3em] block overflow-hidden py-[0.3em] ${className ?? ""}`}
    >
      <motion.span
        initial={{ y: "170%" }}
        {...animation}
        transition={{ duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] }}
        className="block"
      >
        {children}
      </motion.span>
    </span>
  );
}

/** A softer entrance for blocks that would look odd sliding a full line. */
export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-6% 0px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Staggers its children's entrances by index. */
export function Stagger({
  children,
  className,
  step = 0.06,
}: {
  children: ReactNode[];
  className?: string;
  step?: number;
}) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <FadeIn key={index} delay={index * step}>
          {child}
        </FadeIn>
      ))}
    </div>
  );
}
