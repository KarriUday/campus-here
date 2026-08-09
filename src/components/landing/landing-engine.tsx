"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Ban, Check, TriangleAlert, Cpu, Network } from "lucide-react";
import { Reveal } from "./motion";
import { SectionHeading } from "./section-heading";

const EASE = [0.22, 1, 0.36, 1] as const;
const VIEWPORT = { once: true, margin: "-60px" } as const;

/** The worked example from the project report, which is also a unit test. */
const MATCHES = [
  { title: "Smart Attendance Face Recognition", score: 1.0, band: "blocked" },
  { title: "Attendance Monitoring with Facial Biometrics", score: 0.86, band: "warning" },
  { title: "Classroom Occupancy Analytics", score: 0.41, band: "allowed" },
] as const;

const BAND_STYLE = {
  blocked: { bar: "bg-red-500", chip: "border-red-500/30 bg-red-500/10 text-red-400", label: "Blocked" },
  warning: { bar: "bg-amber-500", chip: "border-amber-500/30 bg-amber-500/10 text-amber-400", label: "Warning" },
  allowed: { bar: "bg-emerald-500", chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400", label: "Allowed" },
} as const;

/** How a guide ranks competing proposals, in order. */
const TIEBREAKS = [
  "Domain match with the group's chosen area",
  "Higher group average CGPA",
  "Earlier preference submission",
  "Group code ascending — the deterministic last word",
];

function ScoreBar({ score, delay }: { score: number; delay: number }) {
  const reduced = useReducedMotion();
  const pct = `${Math.round(score * 100)}%`;

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-900 border border-white/5">
      <motion.div
        className={`h-full rounded-full ${BAND_STYLE[score >= 0.95 ? "blocked" : score >= 0.8 ? "warning" : "allowed"].bar}`}
        initial={reduced ? { width: pct } : { width: 0 }}
        whileInView={{ width: pct }}
        viewport={VIEWPORT}
        transition={{ duration: 1, delay, ease: EASE }}
      />
    </div>
  );
}

export function LandingEngine() {
  return (
    <section id="engine" className="scroll-mt-24 py-20 sm:py-28">
      <div className="relative rounded-[32px] sm:rounded-[44px] border border-white/10 bg-[#0A0E1A] p-6 sm:p-12 shadow-[0_20px_70px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Background Radial Lights */}
        <div className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-sky-500/10 blur-[130px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 size-96 rounded-full bg-purple-500/10 blur-[130px]" />

        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <SectionHeading
            eyebrow="Under the hood"
            title="Two engines doing the hard part"
            body="Both are pure functions with no database import, so they unit-test without a connection — and a dry run provably executes the same code as the committed run."
          />

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {/* Originality Card */}
            <Reveal className="h-full">
              <div className="group h-full rounded-3xl border border-white/10 bg-[#101526]/80 p-7 backdrop-blur-xl transition-all duration-300 hover:border-sky-500/30 hover:bg-[#141B30]">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 font-mono text-[11px] font-semibold text-sky-400 uppercase tracking-wider">
                    <Cpu className="size-3.5" />
                    Originality
                  </span>
                  <span className="font-mono text-xs text-slate-400">TF-IDF + Cosine</span>
                </div>
                <h3 className="mt-4 text-xl font-bold tracking-tight text-white group-hover:text-sky-300 transition-colors">
                  TF-IDF, corrected by four lexical signals
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  Cosine alone under-reads a near-duplicate whose shared words are
                  common across the corpus. Edit distance alone over-reads two
                  unrelated titles of similar shape. The score weights cosine at
                  0.65 and the strongest of Dice, containment, 3-gram Jaccard and
                  Levenshtein at 0.35.
                </p>

                <div className="mt-6 rounded-2xl border border-white/10 bg-[#0B0F1D] p-4 sm:p-5">
                  <p className="font-mono text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
                    Checking
                  </p>
                  <p className="mt-1 font-mono text-sm font-medium text-sky-200">
                    “Smart Attendance via Face Recognition”
                  </p>

                  <ul className="mt-5 space-y-4">
                    {MATCHES.map((match, i) => {
                      const style = BAND_STYLE[match.band];
                      return (
                        <li key={match.title}>
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="min-w-0 truncate text-xs text-slate-300">
                              {match.title}
                            </span>
                            <span className="font-mono text-xs font-bold text-white shrink-0">
                              {match.score.toFixed(2)}
                            </span>
                          </div>
                          <div className="mt-1.5 flex items-center gap-3">
                            <ScoreBar score={match.score} delay={0.15 + i * 0.15} />
                            <span
                              className={`shrink-0 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold ${style.chip}`}
                            >
                              {style.label}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <p className="mt-5 text-xs text-slate-400 leading-relaxed border-t border-white/10 pt-3">
                    Both titles reduce to{" "}
                    <code className="rounded border border-sky-500/20 bg-sky-500/10 px-1.5 py-0.5 font-mono text-[11px] text-sky-300">
                      attendance face recognition
                    </code>
                    . When two titles share a token set exactly, the score is forced
                    to 1.00 — same words in any order is the same project.
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Ban className="size-3.5 text-red-400" aria-hidden /> ≥ 0.95 blocked
                  </span>
                  <span className="flex items-center gap-1.5">
                    <TriangleAlert className="size-3.5 text-amber-400" aria-hidden /> 0.80–0.94 warning
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="size-3.5 text-emerald-400" aria-hidden /> below 0.80 allowed
                  </span>
                </div>
              </div>
            </Reveal>

            {/* Allocation Card */}
            <Reveal delay={0.1} className="h-full">
              <div className="group h-full rounded-3xl border border-white/10 bg-[#101526]/80 p-7 backdrop-blur-xl transition-all duration-300 hover:border-purple-500/30 hover:bg-[#141B30]">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 font-mono text-[11px] font-semibold text-purple-400 uppercase tracking-wider">
                    <Network className="size-3.5" />
                    Allocation
                  </span>
                  <span className="font-mono text-xs text-slate-400">Gale-Shapley Algorithm</span>
                </div>
                <h3 className="mt-4 text-xl font-bold tracking-tight text-white group-hover:text-purple-300 transition-colors">
                  Gale-Shapley, made reproducible
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  Groups propose down their six ranked preferences; each guide holds
                  the best proposals up to capacity and releases the rest. Manual
                  assignments never get recomputed — they consume capacity before
                  matching begins and leave the market.
                </p>

                <div className="mt-6 rounded-2xl border border-white/10 bg-[#0B0F1D] p-4 sm:p-5">
                  <p className="font-mono text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
                    A guide ranks proposals by
                  </p>
                  <ol className="mt-4 space-y-3">
                    {TIEBREAKS.map((rule, i) => (
                      <motion.li
                        key={rule}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={VIEWPORT}
                        transition={{ duration: 0.5, delay: 0.15 + i * 0.1, ease: EASE }}
                        className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#121728] p-2.5"
                      >
                        <span className="font-mono flex size-7 shrink-0 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-xs font-bold text-purple-300">
                          {i + 1}
                        </span>
                        <span className="text-xs sm:text-sm font-medium text-slate-200">{rule}</span>
                      </motion.li>
                    ))}
                  </ol>
                </div>

                <p className="mt-5 text-xs text-slate-400 leading-relaxed">
                  <span className="font-semibold text-white">Stability is checked, not assumed.</span>{" "}
                  A blocking-pair search runs against the result, and a run that
                  fails its own check is refused rather than written. Committing
                  happens inside a serializable transaction.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
