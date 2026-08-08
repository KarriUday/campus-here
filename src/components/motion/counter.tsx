"use client";

import { useInView, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/**
 * Counts a figure up when it scrolls into view.
 *
 * Non-numeric values (an em dash, "8.46 / 10") are rendered verbatim — the
 * dashboards pass both through the same tile.
 */
export function Counter({
  value,
  duration = 1.1,
  className,
}: {
  value: number | string;
  duration?: number;
  className?: string;
}) {
  const numeric = typeof value === "number" ? value : Number(value);
  const isNumeric = Number.isFinite(numeric) && String(value).trim() !== "";

  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduced = useReducedMotion();
  const animates = isNumeric && !reduced;

  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { duration: duration * 1000, bounce: 0 });
  const [animated, setAnimated] = useState<string | null>(null);

  useEffect(() => {
    if (animates && inView) motionValue.set(numeric);
  }, [animates, inView, motionValue, numeric]);

  useEffect(() => {
    if (!animates) return;
    // Integers count as integers; a decimal keeps two places.
    const decimals = Number.isInteger(numeric) ? 0 : 2;
    // Subscribing to the spring is an external store, not a render-time set.
    return spring.on("change", (latest) => setAnimated(latest.toFixed(decimals)));
  }, [animates, numeric, spring]);

  // Everything that does not animate is derived during render, so no effect
  // has to push it into state.
  const shown = animates
    ? (animated ?? (Number.isInteger(numeric) ? "0" : "0.00"))
    : value;

  return (
    <span ref={ref} className={className}>
      {shown}
    </span>
  );
}
