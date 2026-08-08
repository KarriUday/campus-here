"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Ban, Check, TriangleAlert } from "lucide-react";
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
  blocked: { bar: "bg-error", chip: "bg-error-soft text-error-ink", label: "Blocked" },
  warning: { bar: "bg-warning", chip: "bg-warning-soft text-warning-ink", label: "Warning" },
  allowed: { bar: "bg-success", chip: "bg-success-soft text-success-ink", label: "Allowed" },
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
    <div className="bg-surface h-1.5 w-full overflow-hidden rounded-full">
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
    <section id="engine" className="scroll-mt-24 py-24 sm:py-32">
      {/* Tinted band so the two deep-dives read as a distinct chapter. */}
      <div className="border-border-subtle bg-surface/60 border-y py-20 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <SectionHeading
            eyebrow="Under the hood"
            title="Two engines doing the hard part"
            body="Both are pure functions with no database import, so they unit-test without a connection — and a dry run provably executes the same code as the committed run."
          />

          <div className="mt-14 grid gap-5 lg:grid-cols-2">
            {/* Originality */}
            <Reveal className="h-full">
              <div className="border-border-subtle bg-surface-raised shadow-card h-full rounded-3xl border p-7">
                <span className="text-primary bg-primary-soft inline-flex rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.14em] uppercase">
                  Originality
                </span>
                <h3 className="text-ink mt-4 text-xl font-semibold tracking-tight">
                  TF-IDF, corrected by four lexical signals
                </h3>
                <p className="text-ink-secondary mt-3 text-sm leading-relaxed">
                  Cosine alone under-reads a near-duplicate whose shared words are
                  common across the corpus. Edit distance alone over-reads two
                  unrelated titles of similar shape. The score weights cosine at
                  0.65 and the strongest of Dice, containment, 3-gram Jaccard and
                  Levenshtein at 0.35.
                </p>

                <div className="border-border-subtle mt-6 rounded-2xl border p-4">
                  <p className="text-ink-tertiary text-[11px] font-semibold tracking-[0.14em] uppercase">
                    Checking
                  </p>
                  <p className="text-ink mt-1 text-sm font-medium">
                    “Smart Attendance via Face Recognition”
                  </p>

                  <ul className="mt-5 space-y-4">
                    {MATCHES.map((match, i) => {
                      const style = BAND_STYLE[match.band];
                      return (
                        <li key={match.title}>
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="text-ink-secondary min-w-0 truncate text-xs">
                              {match.title}
                            </span>
                            <span className="mono text-ink shrink-0 text-xs font-semibold">
                              {match.score.toFixed(2)}
                            </span>
                          </div>
                          <div className="mt-1.5 flex items-center gap-3">
                            <ScoreBar score={match.score} delay={0.15 + i * 0.15} />
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.chip}`}
                            >
                              {style.label}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <p className="text-ink-tertiary mt-5 text-xs leading-relaxed">
                    Both titles reduce to{" "}
                    <code className="bg-surface text-ink rounded px-1 py-0.5 text-[11px]">
                      attendance face recognition
                    </code>
                    . When two titles share a token set exactly, the score is forced
                    to 1.00 — same words in any order is the same project.
                  </p>
                </div>

                <div className="text-ink-tertiary mt-5 flex flex-wrap gap-x-5 gap-y-1.5 text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <Ban className="text-error size-3" aria-hidden /> ≥ 0.95 blocked
                  </span>
                  <span className="flex items-center gap-1.5">
                    <TriangleAlert className="text-warning size-3" aria-hidden /> 0.80–0.94 warning
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="text-success size-3" aria-hidden /> below 0.80 allowed
                  </span>
                </div>
              </div>
            </Reveal>

            {/* Allocation */}
            <Reveal delay={0.1} className="h-full">
              <div className="border-border-subtle bg-surface-raised shadow-card h-full rounded-3xl border p-7">
                <span className="text-sky bg-sky/10 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.14em] uppercase">
                  Allocation
                </span>
                <h3 className="text-ink mt-4 text-xl font-semibold tracking-tight">
                  Gale-Shapley, made reproducible
                </h3>
                <p className="text-ink-secondary mt-3 text-sm leading-relaxed">
                  Groups propose down their six ranked preferences; each guide holds
                  the best proposals up to capacity and releases the rest. Manual
                  assignments never get recomputed — they consume capacity before
                  matching begins and leave the market.
                </p>

                <div className="border-border-subtle mt-6 rounded-2xl border p-4">
                  <p className="text-ink-tertiary text-[11px] font-semibold tracking-[0.14em] uppercase">
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
                        className="flex items-center gap-3"
                      >
                        <span className="mono bg-sky/10 text-sky flex size-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold">
                          {i + 1}
                        </span>
                        <span className="text-ink-secondary text-sm">{rule}</span>
                      </motion.li>
                    ))}
                  </ol>
                </div>

                <p className="text-ink-tertiary mt-5 text-xs leading-relaxed">
                  <span className="text-ink font-semibold">Stability is checked, not assumed.</span>{" "}
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
