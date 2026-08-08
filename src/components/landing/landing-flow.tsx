"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { useRef } from "react";
import { Reveal } from "./motion";
import { SectionHeading } from "./section-heading";

const STEPS = [
  {
    step: "01",
    title: "The coordinator imports the cohort",
    body: "Students and faculty arrive as CSV. Validation catches wrong CGPA, duplicate USNs and missing emails before a single row is written, and a student who already exists is enrolled into the cycle rather than rejected.",
    accent: "text-ink-secondary",
    ring: "bg-sky",
  },
  {
    step: "02",
    title: "Students form groups of four",
    body: "A leader invites; accepting one invite declines the rest inside the same transaction. Average CGPA is computed by the database, and the group locks on submit — membership, title and preferences all become immutable.",
    accent: "text-ink-secondary",
    ring: "bg-lilac",
  },
  {
    step: "03",
    title: "A title clears the originality gate",
    body: "The live score while typing is advisory; the write path re-runs the whole check. Same words in any order reduce to the same token set and score 1.00 — blocked, with the five closest matches explained.",
    accent: "text-ink-secondary",
    ring: "bg-primary",
  },
  {
    step: "04",
    title: "The engine matches guides",
    body: "Groups propose down six ranked preferences. Guides hold the best proposals up to capacity, ranking by domain match, then CGPA, then submission time, then group code — so the same input always yields the same matching.",
    accent: "text-ink-secondary",
    ring: "bg-sky",
  },
  {
    step: "05",
    title: "Reviews run and reports come out",
    body: "R0, P1 and P2 are scheduled against the calendar with conflicts flagged, reminders queue at 15 and 7 days, attendance and marks are recorded per session, and nine reports export as formatted workbooks.",
    accent: "text-ink-secondary",
    ring: "bg-lime",
  },
];

export function LandingFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // The rail fills as the list crosses the middle of the viewport.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 65%", "end 55%"],
  });
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <section id="flow" className="scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="End to end"
          title="How a cycle moves"
          body="Five stages from an empty database to a signed-off review — each one gated so the next can trust what came before."
        />

        <div ref={ref} className="relative mx-auto mt-16 max-w-3xl">
          {/* Rail: a static track with a solid fill that grows over it. */}
          <div
            aria-hidden
            className="bg-border-subtle absolute top-2 bottom-2 left-[15px] w-px sm:left-[19px]"
          >
            {!reduced && (
              <motion.div
                style={{ scaleY }}
                className="bg-lime absolute inset-0 origin-top"
              />
            )}
          </div>

          <ol className="space-y-10">
            {STEPS.map((item) => (
              <li key={item.step}>
                <Reveal y={24} className="flex gap-5 sm:gap-7">
                  <span className="relative z-10 shrink-0">
                    <span className="border-border-subtle bg-surface-raised shadow-card flex size-8 items-center justify-center rounded-full border sm:size-10">
                      <span className={`size-2 rounded-full ${item.ring}`} />
                    </span>
                  </span>
                  <div className="min-w-0 pt-0.5 sm:pt-1.5">
                    <span
                      className={`mono text-[11px] font-semibold tracking-[0.18em] ${item.accent}`}
                    >
                      STEP {item.step}
                    </span>
                    <h3 className="text-ink mt-1.5 text-lg font-semibold tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-ink-secondary mt-2 text-sm leading-relaxed">
                      {item.body}
                    </p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
