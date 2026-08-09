"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, Database, Cpu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { scrollToAnchor } from "./scroll-to-anchor";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Rows in the mock allocation panel. Illustrative, not a live query. */
const PREVIEW_ROWS = [
  { code: "CSE6-A-017", title: "Differential Privacy Budget Tracker", guide: "Dr. A. Rao", rank: 1, domain: "Security" },
  { code: "CSE6-A-013", title: "Behavioural Biometrics for Auth", guide: "Dr. K. Menon", rank: 1, domain: "AI / ML" },
  { code: "CSE6-B-004", title: "Federated Learning on Edge Devices", guide: "Dr. S. Iyer", rank: 2, domain: "IoT" },
];

export function LandingHero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const copyY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const panelY = useTransform(scrollYProgress, [0, 1], [0, -30]);

  return (
    <section
      ref={ref}
      className="relative rounded-[32px] sm:rounded-[44px] bg-gradient-to-b from-[#111736] via-[#0E132D] to-[#0A0E22] border border-[#5C68A6]/30 px-5 pt-28 pb-20 sm:px-8 sm:pt-36 sm:pb-24 overflow-hidden shadow-[0_20px_70px_rgba(0,0,0,0.7)]"
    >
      {/* Background ambient radial glow shapes in BMSIT Indigo & Periwinkle */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[700px] bg-[#3B52E6]/20 blur-[140px] rounded-full" />
      <div className="pointer-events-none absolute top-1/2 right-0 size-[500px] bg-[#7B88D6]/15 blur-[150px] rounded-full" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <motion.div
          style={reduced ? undefined : { y: copyY, opacity: copyOpacity }}
          className="mx-auto max-w-3xl text-center"
        >
          {/* Badge with Official Logo Icon */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="inline-flex items-center gap-2.5 rounded-full border border-[#7B88D6]/40 bg-[#161D42]/90 px-4 py-1.5 text-xs font-semibold text-[#C8D1F8] backdrop-blur-md shadow-[0_0_20px_rgba(75,99,246,0.2)]"
          >
            <Image
              src="/assets/bmsit-logo.png"
              alt="BMSIT Logo"
              width={20}
              height={20}
              className="object-contain"
            />
            <span>BMS Institute of Technology and Management · Dept. of CSE</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08, ease: EASE }}
            className="mt-7 text-balance font-extrabold tracking-tight text-white text-4xl sm:text-6xl lg:text-[4.25rem] leading-[1.08]"
          >
            The academic project cycle,{" "}
            <span className="bg-gradient-to-r from-[#7B88D6] via-[#94A2F2] to-[#B0BBFA] bg-clip-text text-transparent">
              start to finish
            </span>
            .
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.16, ease: EASE }}
            className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-[#C8CFE6] text-pretty"
          >
            Campus Here takes a cohort from CSV upload to final review — group
            formation, title originality checks, guide allocation, review
            scheduling and reporting — in one role-aware platform.
          </motion.p>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.24, ease: EASE }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href="/login"
              className="group relative inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#3B52E6] via-[#4B63F6] to-[#6074F8] px-8 text-[15px] font-bold text-white transition-all shadow-[0_0_28px_rgba(75,99,246,0.45)] hover:shadow-[0_0_38px_rgba(75,99,246,0.75)] hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
            >
              <span>Sign in to your dashboard</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
            <a
              href="#flow"
              onClick={scrollToAnchor}
              className="inline-flex h-13 w-full items-center justify-center rounded-full border border-[#5C68A6]/30 bg-white/5 backdrop-blur-md px-8 text-[15px] font-semibold text-[#E4E7F4] hover:bg-white/10 hover:text-white transition-all sm:w-auto"
            >
              See how it works
            </a>
          </motion.div>

          {/* Key pillars */}
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.36 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-[#A8B2E6]"
          >
            {[
              { text: "30 screens on real queries", icon: Cpu },
              { text: "JWT auth and role gating", icon: ShieldCheck },
              { text: "No sample data anywhere", icon: Database },
            ].map((item) => (
              <li key={item.text} className="flex items-center gap-2 bg-[#141A3B]/80 rounded-full px-3.5 py-1 border border-[#5C68A6]/20">
                <item.icon className="size-3.5 text-[#7B88D6]" aria-hidden />
                <span>{item.text}</span>
              </li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Interactive Application Preview Window */}
        <motion.div
          style={reduced ? undefined : { y: panelY }}
          className="mt-14 [perspective:1600px] sm:mt-18"
        >
          <motion.div
            initial={reduced ? undefined : { opacity: 0, y: 50, rotateX: 12 }}
            animate={reduced ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1.0, delay: 0.3, ease: EASE }}
            className="relative mx-auto max-w-4xl rounded-2xl border border-[#5C68A6]/30 bg-[#121838]/90 p-2 sm:p-3 shadow-[0_30px_90px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
          >
            {/* Ambient aura behind app window */}
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-[#3B52E6]/25 via-[#7B88D6]/20 to-[#4B63F6]/25 blur-xl opacity-60 -z-10" />

            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0B0F24]">
              {/* Window Header */}
              <div className="flex items-center justify-between border-b border-white/10 bg-[#0E1430] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-red-500/80" />
                  <span className="size-3 rounded-full bg-amber-500/80" />
                  <span className="size-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 font-mono text-xs text-[#A8B2E6]">
                    Allocation · 2025–26 Major Projects
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Live Database
                  </span>
                </div>
              </div>

              {/* Window Body */}
              <div className="p-4 sm:p-6 space-y-4">
                {/* Stats Bar */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  {[
                    { label: "Students", value: "300", change: "100% Enrolled", tint: "text-[#7B88D6]" },
                    { label: "Groups", value: "71", change: "Formed & Locked", tint: "text-[#6074F8]" },
                    { label: "Allocated", value: "30", change: "Gale-Shapley Pass", tint: "text-emerald-400" },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={reduced ? undefined : { opacity: 0, y: 14 }}
                      animate={reduced ? undefined : { opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.7 + i * 0.09, ease: EASE }}
                      className="rounded-xl border border-white/10 bg-[#13193A] p-3.5 shadow-inner"
                    >
                      <p className="text-[11px] font-medium text-[#A8B2E6]">{stat.label}</p>
                      <p className={`font-mono text-2xl font-bold mt-1 ${stat.tint}`}>
                        {stat.value}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{stat.change}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Table Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1 text-[11px] font-mono text-[#A8B2E6]">
                    <span>GROUP CODE</span>
                    <span>PROJECT TITLE</span>
                    <span className="hidden sm:inline">GUIDE</span>
                    <span>MATCH RANK</span>
                  </div>
                  {PREVIEW_ROWS.map((row, i) => (
                    <motion.div
                      key={row.code}
                      initial={reduced ? undefined : { opacity: 0, x: -12 }}
                      animate={reduced ? undefined : { opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.95 + i * 0.12, ease: EASE }}
                      className="group flex items-center gap-3 rounded-xl border border-white/5 bg-[#111634] px-3.5 py-3 hover:border-[#7B88D6]/40 hover:bg-[#161D42] transition-all"
                    >
                      <span className="font-mono text-xs font-semibold text-[#A8B2E6] group-hover:text-[#7B88D6] w-24 shrink-0">
                        {row.code}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs sm:text-sm font-medium text-white">
                        {row.title}
                      </span>
                      <span className="hidden shrink-0 text-xs text-[#C8CFE6] sm:block">
                        {row.guide}
                      </span>
                      <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
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
