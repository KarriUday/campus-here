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
    ring: "border-sky-500 bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.8)]",
    badge: "CSV Import & Validation",
  },
  {
    step: "02",
    title: "Students form groups of four",
    body: "A leader invites; accepting one invite declines the rest inside the same transaction. Average CGPA is computed by the database, and the group locks on submit — membership, title and preferences all become immutable.",
    ring: "border-purple-500 bg-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.8)]",
    badge: "Serializable Tx",
  },
  {
    step: "03",
    title: "A title clears the originality gate",
    body: "The live score while typing is advisory; the write path re-runs the whole check. Same words in any order reduce to the same token set and score 1.00 — blocked, with the five closest matches explained.",
    ring: "border-emerald-500 bg-emerald-400 shadow-[0_0_12px_rgba(34,197,94,0.8)]",
    badge: "TF-IDF Originality Engine",
  },
  {
    step: "04",
    title: "The engine matches guides",
    body: "Groups propose down six ranked preferences. Guides hold the best proposals up to capacity, ranking by domain match, then CGPA, then submission time, then group code — so the same input always yields the same matching.",
    ring: "border-blue-500 bg-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.8)]",
    badge: "Gale-Shapley Matching",
  },
  {
    step: "05",
    title: "Reviews run and reports come out",
    body: "R0, P1 and P2 are scheduled against the calendar with conflicts flagged, reminders queue at 15 and 7 days, attendance and marks are recorded per session, and nine reports export as formatted workbooks.",
    ring: "border-amber-500 bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.8)]",
    badge: "Evaluation & Reports",
  },
];

export function LandingFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

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
    <section id="flow" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="End to end"
          title="How a cycle moves"
          body="Five stages from an empty database to a signed-off review — each one gated so the next can trust what came before."
        />

        <div ref={ref} className="relative mx-auto mt-16 max-w-3xl">
          {/* Animated Glowing Rail */}
          <div
            aria-hidden
            className="absolute top-3 bottom-3 left-[19px] w-0.5 bg-white/10 sm:left-[23px]"
          >
            {!reduced && (
              <motion.div
                style={{ scaleY }}
                className="absolute inset-0 origin-top bg-gradient-to-b from-sky-400 via-blue-500 to-emerald-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
              />
            )}
          </div>

          <ol className="space-y-8 sm:space-y-10">
            {STEPS.map((item) => (
              <li key={item.step}>
                <Reveal y={24} className="flex gap-5 sm:gap-7">
                  <span className="relative z-10 shrink-0">
                    <span className="flex size-10 items-center justify-center rounded-full border border-white/20 bg-[#0E1322] shadow-[0_0_15px_rgba(0,0,0,0.5)] sm:size-12">
                      <span className={`size-3 rounded-full ${item.ring}`} />
                    </span>
                  </span>
                  <div className="group min-w-0 flex-1 rounded-3xl border border-white/10 bg-[#0E1322]/80 p-6 backdrop-blur-xl transition-all duration-300 hover:border-white/25 hover:bg-[#12182B]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-xs font-semibold tracking-widest text-sky-400">
                        STEP {item.step}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[11px] font-medium text-slate-300">
                        {item.badge}
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-bold tracking-tight text-white group-hover:text-sky-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
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
