"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Database,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { scrollToAnchor } from "./scroll-to-anchor";

const EASE = [0.22, 1, 0.36, 1] as const;

const GROUPS = [
  {
    code: "CSE6-A-017",
    title: "Differential Privacy Budget Tracker",
    guide: "Dr. A. Rao",
    rank: "01",
  },
  {
    code: "CSE6-A-013",
    title: "Behavioural Biometrics for Auth",
    guide: "Dr. K. Menon",
    rank: "01",
  },
  {
    code: "CSE6-B-004",
    title: "Federated Learning on Edge Devices",
    guide: "Dr. S. Iyer",
    rank: "02",
  },
];

const METRICS = [
  { label: "Students", value: "300", note: "Enrolled" },
  { label: "Groups", value: "71", note: "Formation locked" },
  { label: "Allocated", value: "68", note: "3 pending review" },
];

export function LandingHero() {
  const reduced = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-b border-[var(--landing-line)] pt-28 sm:pt-32">
      <div className="landing-grid absolute inset-y-0 right-0 hidden w-[48%] opacity-45 lg:block" aria-hidden="true" />
      <div className="absolute top-0 left-[7%] h-20 w-px bg-[#b9272f]" aria-hidden="true" />

      <div className="relative mx-auto grid min-h-[760px] w-full max-w-[1180px] items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.88fr_1.12fr] lg:gap-12 lg:px-6 xl:gap-20">
        <motion.div
          initial={reduced ? undefined : { opacity: 0, y: 22 }}
          animate={reduced ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative z-10"
        >
          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.15em] text-[#b9272f] uppercase">
            <span className="h-px w-8 bg-[#b9272f]" aria-hidden="true" />
            Major project operations
          </p>

          <h1 className="mt-7 max-w-xl text-[2.85rem] leading-[0.98] font-semibold tracking-[-0.055em] text-[var(--landing-text)] text-balance sm:text-6xl lg:text-[4.2rem]">
            Every project cycle, accounted for.
          </h1>

          <p className="mt-7 max-w-xl text-base leading-7 text-[var(--landing-muted)] sm:text-lg sm:leading-8">
            A single operating system for BMSIT CSE project work—from cohort
            intake and group formation to guide allocation, reviews and reports.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="group inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-[#28265f] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1d1b48]"
            >
              Open your workspace
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <a
              href="#flow"
              onClick={scrollToAnchor}
              className="inline-flex h-13 items-center justify-center rounded-xl border border-[var(--landing-line-strong)] bg-[var(--landing-surface)] px-6 text-sm font-semibold text-[var(--landing-text)] transition-colors hover:bg-[var(--landing-soft)]"
            >
              View the workflow
            </a>
          </div>

          <ul className="mt-10 grid max-w-lg gap-3 text-sm text-[var(--landing-muted)] sm:grid-cols-2">
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="size-4 text-[#b9272f]" aria-hidden="true" />
              Real database workflows
            </li>
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="size-4 text-[#b9272f]" aria-hidden="true" />
              Role-scoped by design
            </li>
          </ul>
        </motion.div>

        <motion.div
          initial={reduced ? undefined : { opacity: 0, y: 34 }}
          animate={reduced ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.12, ease: EASE }}
          className="relative z-10"
        >
          <div className="absolute -top-5 -right-5 -bottom-5 left-10 border border-[var(--landing-line)] bg-[var(--landing-surface-2)]" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-[22px] border border-[var(--landing-line-strong)] bg-[var(--landing-panel)] shadow-[var(--landing-shadow)]">
            <div className="flex h-13 items-center justify-between border-b border-[var(--landing-line)] px-4 sm:px-5">
              <div className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-lg bg-[#28265f] text-[0.62rem] font-bold text-white">
                  CH
                </span>
                <span className="text-xs font-semibold text-[var(--landing-text)]">
                  Allocation workspace
                </span>
              </div>
              <span className="flex items-center gap-2 text-[0.66rem] font-medium text-[var(--landing-muted)]">
                <span className="size-1.5 rounded-full bg-[#2f9b63]" />
                2025–26 · Active
              </span>
            </div>

            <div className="grid min-h-[470px] sm:grid-cols-[120px_1fr]">
              <aside className="hidden border-r border-[var(--landing-line)] bg-[var(--landing-panel-raised)] p-3 sm:block">
                <p className="px-2 pt-1 text-[0.58rem] font-semibold tracking-[0.14em] text-[var(--landing-faint)] uppercase">
                  Workspace
                </p>
                <div className="mt-4 space-y-1 text-[0.68rem] font-medium">
                  {[
                    "Overview",
                    "Students",
                    "Groups",
                    "Allocation",
                    "Reviews",
                    "Reports",
                  ].map((item) => (
                    <div
                      key={item}
                      className={
                        item === "Allocation"
                          ? "rounded-lg bg-[#28265f] px-2.5 py-2 text-white"
                          : "rounded-lg px-2.5 py-2 text-[var(--landing-muted)]"
                      }
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </aside>

              <div className="min-w-0 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.62rem] font-semibold tracking-[0.12em] text-[#b9272f] uppercase">
                      Major projects
                    </p>
                    <h2 className="mt-1 text-base font-semibold tracking-[-0.02em] text-[var(--landing-text)]">
                      Guide allocation
                    </h2>
                  </div>
                  <button
                    type="button"
                    tabIndex={-1}
                    className="rounded-lg border border-[var(--landing-line)] bg-[var(--landing-surface)] px-3 py-1.5 text-[0.62rem] font-semibold text-[var(--landing-muted)]"
                  >
                    Export run
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2.5">
                  {METRICS.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-xl border border-[var(--landing-line)] bg-[var(--landing-panel-raised)] p-3"
                    >
                      <p className="text-[0.58rem] font-medium text-[var(--landing-muted)]">
                        {metric.label}
                      </p>
                      <p className="mono mt-1.5 text-xl font-semibold text-[var(--landing-text)] sm:text-2xl">
                        {metric.value}
                      </p>
                      <p className="mt-1 hidden text-[0.55rem] text-[var(--landing-faint)] sm:block">
                        {metric.note}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 overflow-hidden rounded-xl border border-[var(--landing-line)]">
                  <div className="grid grid-cols-[82px_1fr_56px] gap-2 bg-[var(--landing-panel-raised)] px-3 py-2 text-[0.53rem] font-semibold tracking-[0.08em] text-[var(--landing-faint)] uppercase sm:grid-cols-[90px_1fr_90px_56px]">
                    <span>Group</span>
                    <span>Project</span>
                    <span className="hidden sm:block">Guide</span>
                    <span>Rank</span>
                  </div>
                  {GROUPS.map((group) => (
                    <div
                      key={group.code}
                      className="grid grid-cols-[82px_1fr_56px] items-center gap-2 border-t border-[var(--landing-line)] px-3 py-3 text-[0.62rem] sm:grid-cols-[90px_1fr_90px_56px]"
                    >
                      <span className="mono text-[var(--landing-muted)]">{group.code}</span>
                      <span className="truncate font-medium text-[var(--landing-text)]">
                        {group.title}
                      </span>
                      <span className="hidden truncate text-[var(--landing-muted)] sm:block">
                        {group.guide}
                      </span>
                      <span className="mono rounded-md bg-[#e7f3ec] px-2 py-1 text-center font-semibold text-[#247248]">
                        {group.rank}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="flex items-center gap-2.5 rounded-xl border border-[var(--landing-line)] p-3">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-[var(--landing-navy-soft)] text-[var(--landing-navy)]">
                      <Database className="size-4" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-[0.61rem] font-semibold text-[var(--landing-text)]">
                        Stable matching
                      </span>
                      <span className="mt-0.5 block text-[0.54rem] text-[var(--landing-muted)]">
                        74 proposals processed
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-xl border border-[var(--landing-line)] p-3">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-[#fff0f0] text-[#b9272f]">
                      <CalendarDays className="size-4" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-[0.61rem] font-semibold text-[var(--landing-text)]">
                        Next review
                      </span>
                      <span className="mt-0.5 block text-[0.54rem] text-[var(--landing-muted)]">
                        R0 · 18 September
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -right-3 -bottom-3 flex items-center gap-2 rounded-lg border border-[var(--landing-line)] bg-[var(--landing-surface)] px-3 py-2 text-[0.62rem] font-semibold text-[var(--landing-text)] shadow-lg sm:right-5 sm:bottom-5">
            <CircleDot className="size-3.5 text-[#2f9b63]" aria-hidden="true" />
            Stability check passed
          </div>
        </motion.div>
      </div>
    </section>
  );
}
