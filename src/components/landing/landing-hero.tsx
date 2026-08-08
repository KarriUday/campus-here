"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { scrollToAnchor } from "./scroll-to-anchor";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Rows in the mock allocation panel. Illustrative, not a live query. */
const PREVIEW_ROWS = [
  { code: "CSE6-A-017", title: "Differential Privacy Budget Tracker", guide: "Dr. A. Rao", rank: 1 },
  { code: "CSE6-A-013", title: "Behavioural Biometrics for Auth", guide: "Dr. K. Menon", rank: 1 },
  { code: "CSE6-B-004", title: "Federated Learning on Edge Devices", guide: "Dr. S. Iyer", rank: 2 },
];

export function LandingHero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  // Parallax is keyed to the hero's own progress through the viewport, so it
  // behaves the same on a laptop and a tall phone.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const copyY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const panelY = useTransform(scrollYProgress, [0, 1], [0, -40]);

  return (
    // A flat colour field rather than a drifting gradient wash: the palette is
    // solid blocks, and a soft blur behind the type would read as a different
    // product.
    <section
      ref={ref}
      className="section-field bg-lime relative px-5 pt-28 pb-20 sm:px-8 sm:pt-32 sm:pb-24"
    >
      <div className="mx-auto w-full max-w-6xl">
        <motion.div
          style={reduced ? undefined : { y: copyY, opacity: copyOpacity }}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="bg-surface-raised text-ink inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium"
          >
            <Sparkles className="text-primary size-3.5" aria-hidden />
            BMS Institute of Technology and Management · Dept. of CSE
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08, ease: EASE }}
            className="display text-ink mt-7 text-[2.6rem] text-balance sm:text-6xl lg:text-[4.25rem]"
          >
            The academic project cycle,{" "}
            <span className="squiggle">start to finish</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.16, ease: EASE }}
            className="text-ink/80 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-pretty sm:text-xl"
          >
            Campus Here takes a cohort from CSV upload to final review — group
            formation, title originality checks, guide allocation, review
            scheduling and reporting — in one role-aware platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.24, ease: EASE }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href="/login"
              className="group bg-ink hover:bg-ink/90 inline-flex h-13 w-full items-center justify-center gap-2 rounded-full px-8 text-[15px] font-medium text-white transition-all hover:-translate-y-0.5 sm:w-auto"
            >
              Sign in to your dashboard
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <a
              href="#flow"
              onClick={scrollToAnchor}
              className="bg-surface-raised text-ink hover:bg-bg inline-flex h-13 w-full items-center justify-center rounded-full px-8 text-[15px] font-medium transition-colors sm:w-auto"
            >
              See how it works
            </a>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.36 }}
            className="text-ink/70 mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px]"
          >
            {["30 screens on real queries", "JWT auth and role gating", "No sample data anywhere"].map(
              (item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check className="text-ink size-3.5" aria-hidden />
                  {item}
                </li>
              ),
            )}
          </motion.ul>
        </motion.div>

        {/* App preview. Rises and straightens as the hero scrolls. */}
        <motion.div
          style={reduced ? undefined : { y: panelY }}
          className="mt-16 [perspective:1600px] sm:mt-20"
        >
          <motion.div
            initial={reduced ? undefined : { opacity: 0, y: 60, rotateX: 14 }}
            animate={reduced ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1.1, delay: 0.3, ease: EASE }}
            className="bg-surface-raised shadow-raised relative mx-auto max-w-4xl rounded-2xl p-2"
          >
            <div className="bg-bg overflow-hidden rounded-xl">
              <div className="border-border-subtle flex items-center gap-2 border-b px-4 py-3">
                <span className="bg-error/70 size-2.5 rounded-full" />
                <span className="bg-warning/70 size-2.5 rounded-full" />
                <span className="bg-success/70 size-2.5 rounded-full" />
                <span className="text-ink-tertiary ml-3 text-xs">
                  Allocation · 2025–26 Major Projects
                </span>
              </div>

              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Students", value: "300", tint: "text-sky" },
                    { label: "Groups", value: "71", tint: "text-primary" },
                    { label: "Allocated", value: "30", tint: "text-success" },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={reduced ? undefined : { opacity: 0, y: 14 }}
                      animate={reduced ? undefined : { opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.75 + i * 0.09, ease: EASE }}
                      className="bg-surface-raised rounded-xl p-3"
                    >
                      <p className="text-ink-tertiary text-[11px] font-medium">{stat.label}</p>
                      <p className={`mono mt-1 text-2xl font-semibold ${stat.tint}`}>
                        {stat.value}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-4 space-y-2">
                  {PREVIEW_ROWS.map((row, i) => (
                    <motion.div
                      key={row.code}
                      initial={reduced ? undefined : { opacity: 0, x: -12 }}
                      animate={reduced ? undefined : { opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 1 + i * 0.12, ease: EASE }}
                      className="bg-surface-raised flex items-center gap-3 rounded-xl px-3 py-2.5"
                    >
                      <span className="mono text-ink-tertiary hidden w-24 shrink-0 text-[11px] sm:block">
                        {row.code}
                      </span>
                      <span className="text-ink min-w-0 flex-1 truncate text-[13px] font-medium">
                        {row.title}
                      </span>
                      <span className="text-ink-secondary hidden shrink-0 text-xs sm:block">
                        {row.guide}
                      </span>
                      <span className="bg-success-soft text-success-ink shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold">
                        Rank {row.rank}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
