"use client";

import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Scroll-reveal primitives for the landing page.
 *
 * Every animation here is opacity + transform only, and every one collapses to
 * a plain render under `prefers-reduced-motion` — the CSS block in globals.css
 * shortens declarative animations, but Framer Motion drives values in JS and
 * has to be told separately.
 */

/** Ease-out-expo. Fast start, long settle — reads as "smooth" rather than "slow". */
const EASE = [0.22, 1, 0.36, 1] as const;

/** Fires once, slightly before the element reaches the fold. */
const VIEWPORT = { once: true, margin: "-80px 0px -80px 0px" } as const;

export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Travel distance in px. 0 gives a pure fade. */
  y?: number;
  as?: "div" | "section" | "span" | "li";
}) {
  const reduced = useReducedMotion();
  const Tag = motion[as];

  if (reduced) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </Tag>
  );
}

const STAGGER_PARENT: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const STAGGER_CHILD: Variants = {
  hidden: { opacity: 0, y: 24 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/** Wraps a grid or list whose children should cascade in one after another. */
export function Stagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={STAGGER_PARENT}
      initial="hidden"
      whileInView="shown"
      viewport={VIEWPORT}
    >
      {children}
    </motion.div>
  );
}

/** A direct child of `Stagger`. Nesting one anywhere else does nothing. */
export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div className={className} variants={STAGGER_CHILD}>
      {children}
    </motion.div>
  );
}

/**
 * Counts from 0 to `value` the first time it scrolls into view.
 *
 * Driven by rAF against elapsed time rather than a per-frame increment, so the
 * duration holds on a slow frame instead of stretching.
 */
export function CountUp({
  value,
  duration = 1400,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    // Under reduced motion the final value is rendered directly, so there is
    // nothing to animate and no state to set.
    if (!inView || reduced) return;

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // Ease-out-cubic: most of the distance early, then a gentle landing.
      setDisplay(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, duration, reduced]);

  return (
    <span ref={ref} className={cn("mono", className)}>
      {reduced ? value : display}
    </span>
  );
}
