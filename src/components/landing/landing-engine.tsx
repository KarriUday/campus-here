"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, Network, ScanSearch, TriangleAlert, X } from "lucide-react";
import { Reveal } from "./motion";

const EASE = [0.22, 1, 0.36, 1] as const;
const VIEWPORT = { once: true, margin: "-60px" } as const;

const MATCHES = [
  {
    title: "Smart Attendance Face Recognition",
    score: 1,
    label: "Blocked",
    bar: "bg-[#e35d64]",
    icon: X,
  },
  {
    title: "Attendance Monitoring with Facial Biometrics",
    score: 0.86,
    label: "Review",
    bar: "bg-[#e9ad4a]",
    icon: TriangleAlert,
  },
  {
    title: "Classroom Occupancy Analytics",
    score: 0.41,
    label: "Clear",
    bar: "bg-[#55b780]",
    icon: Check,
  },
] as const;

const TIEBREAKS = [
  "Domain match with the group's chosen area",
  "Higher group average CGPA",
  "Earlier preference submission",
  "Group code ascending for a deterministic result",
];

function ScoreBar({ score, delay, className }: { score: number; delay: number; className: string }) {
  const reduced = useReducedMotion();
  const width = `${Math.round(score * 100)}%`;

  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
      <motion.div
        className={`h-full rounded-full ${className}`}
        initial={reduced ? { width } : { width: 0 }}
        whileInView={{ width }}
        viewport={VIEWPORT}
        transition={{ duration: 0.85, delay, ease: EASE }}
      />
    </div>
  );
}

export function LandingEngine() {
  return (
    <section id="engine" className="scroll-mt-24 bg-[#242157] py-24 text-white sm:py-32">
      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-8 lg:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-end">
          <div>
            <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.15em] text-[#ffb6ba] uppercase">
              <span className="h-px w-8 bg-[#e35d64]" aria-hidden="true" />
              Decision engines
            </p>
            <h2 className="mt-5 max-w-3xl text-3xl leading-[1.08] font-semibold tracking-[-0.045em] text-balance sm:text-4xl lg:text-[3.25rem]">
              Difficult decisions, made explainable and repeatable.
            </h2>
          </div>
          <p className="max-w-lg text-sm leading-7 text-[#c9c8dc] lg:justify-self-end">
            Both engines are pure functions. A preview and a committed run execute
            the same code, and every result carries the evidence behind it.
          </p>
        </div>

        <div className="mt-14 grid border-t border-l border-white/15 lg:grid-cols-2">
          <Reveal className="h-full">
            <article className="h-full border-r border-b border-white/15 bg-[#201e4d] p-6 sm:p-8">
              <div className="flex items-center justify-between gap-5">
                <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[#ffb6ba] uppercase">
                  <ScanSearch className="size-4" aria-hidden="true" />
                  Originality
                </span>
                <span className="mono text-[0.65rem] text-[#aaa9c7]">TF-IDF + lexical signals</span>
              </div>

              <h3 className="mt-7 text-2xl font-semibold tracking-[-0.03em]">
                Similarity that shows its work.
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#c9c8dc]">
                Cosine similarity is combined with Dice, containment, 3-gram
                Jaccard and Levenshtein signals, then enforced again when a title
                is submitted.
              </p>

              <div className="mt-8 border border-white/15 bg-[#1a1941] p-5">
                <p className="text-[0.62rem] font-semibold tracking-[0.12em] text-[#aaa9c7] uppercase">
                  Checking proposal
                </p>
                <p className="mono mt-2 text-sm text-white">
                  Smart Attendance via Face Recognition
                </p>

                <ul className="mt-6 space-y-5">
                  {MATCHES.map((match, index) => (
                    <li key={match.title}>
                      <div className="mb-2 flex items-start justify-between gap-4">
                        <span className="min-w-0 truncate text-xs text-[#d7d6e6]">
                          {match.title}
                        </span>
                        <span className="mono shrink-0 text-xs font-semibold text-white">
                          {match.score.toFixed(2)}
                        </span>
                      </div>
                      <div className="grid grid-cols-[1fr_68px] items-center gap-3">
                        <ScoreBar score={match.score} delay={0.12 + index * 0.12} className={match.bar} />
                        <span className="flex items-center gap-1.5 text-[0.6rem] font-semibold text-[#c9c8dc]">
                          <match.icon className="size-3" aria-hidden="true" />
                          {match.label}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-5 text-xs leading-5 text-[#aaa9c7]">
                Scores at 0.95 or above are blocked; 0.80–0.94 requires review.
              </p>
            </article>
          </Reveal>

          <Reveal delay={0.08} className="h-full">
            <article className="h-full border-r border-b border-white/15 bg-[#201e4d] p-6 sm:p-8">
              <div className="flex items-center justify-between gap-5">
                <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[#ffb6ba] uppercase">
                  <Network className="size-4" aria-hidden="true" />
                  Allocation
                </span>
                <span className="mono text-[0.65rem] text-[#aaa9c7]">Gale–Shapley</span>
              </div>

              <h3 className="mt-7 text-2xl font-semibold tracking-[-0.03em]">
                Stable by calculation, not assumption.
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#c9c8dc]">
                Groups propose down six preferences. Guides hold the best proposals
                up to capacity, while locked manual assignments remain untouched.
              </p>

              <div className="mt-8 border border-white/15 bg-[#1a1941] p-5">
                <p className="text-[0.62rem] font-semibold tracking-[0.12em] text-[#aaa9c7] uppercase">
                  Guide tie-break order
                </p>
                <ol className="mt-3">
                  {TIEBREAKS.map((rule, index) => (
                    <motion.li
                      key={rule}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={VIEWPORT}
                      transition={{ duration: 0.45, delay: 0.12 + index * 0.08, ease: EASE }}
                      className="grid grid-cols-[32px_1fr] items-center gap-3 border-b border-white/10 py-3.5 last:border-0"
                    >
                      <span className="mono text-xs font-semibold text-[#ffb6ba]">
                        0{index + 1}
                      </span>
                      <span className="text-sm text-[#d7d6e6]">{rule}</span>
                    </motion.li>
                  ))}
                </ol>
              </div>

              <div className="mt-5 flex items-start gap-3 border-l-2 border-[#e35d64] pl-4">
                <Check className="mt-0.5 size-4 shrink-0 text-[#70cb98]" aria-hidden="true" />
                <p className="text-xs leading-5 text-[#aaa9c7]">
                  A blocking-pair search validates the result. An unstable run is
                  refused before the database transaction begins.
                </p>
              </div>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
