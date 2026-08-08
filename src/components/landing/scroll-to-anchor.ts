import type { MouseEvent } from "react";

/**
 * Smooth-scrolls an in-page anchor link.
 *
 * Applied per click rather than through `scroll-behavior: smooth` on `html`,
 * because Chrome extends that to wheel scrolling as well — which makes the
 * whole page feel like it is gliding, and overshoots on fast flicks.
 *
 * Section targets carry `scroll-mt-24` so `block: "start"` clears the fixed
 * header. Falls back to the browser's default jump when the target is missing.
 */
export function scrollToAnchor(event: MouseEvent<HTMLAnchorElement>) {
  const href = event.currentTarget.getAttribute("href");
  if (!href?.startsWith("#")) return;

  const target = document.querySelector(href);
  if (!target) return;

  event.preventDefault();

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });

  // Keep the URL shareable without pushing a history entry per nav click.
  history.replaceState(null, "", href);
}
