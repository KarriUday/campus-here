import {
  BellRing,
  FileSpreadsheet,
  Fingerprint,
  MessageSquare,
  Network,
  ScanSearch,
  Upload,
  UserCheck,
  Users,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "./motion";
import { SectionHeading } from "./section-heading";

type Feature = {
  icon: LucideIcon;
  title: string;
  body: string;
  badge?: string;
  tint: string;
  glow: string;
  spanCol?: string;
};

const FEATURES: Feature[] = [
  {
    icon: Users,
    title: "Group formation",
    body: "Invite-based groups of exactly four. One active group per student per cycle is a database constraint, not a hopeful check — and average CGPA recomputes on every membership change.",
    badge: "Core Constraint",
    tint: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    glow: "group-hover:shadow-[0_0_30px_rgba(34,197,94,0.2)]",
    spanCol: "lg:col-span-2",
  },
  {
    icon: ScanSearch,
    title: "Title originality",
    body: "TF-IDF cosine against the corpus at 0.65, plus the strongest of four lexical signals at 0.35. Blocked at 0.95, flagged from 0.80, with the overlapping words shown.",
    badge: "AI TF-IDF Engine",
    tint: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    glow: "group-hover:shadow-[0_0_30px_rgba(56,189,248,0.2)]",
    spanCol: "lg:col-span-1",
  },
  {
    icon: Network,
    title: "Guide allocation",
    body: "Gale-Shapley over six ranked preferences with a hard capacity cap per guide. Stability is verified before anything is written, and a dry run executes the same pure code.",
    badge: "Gale-Shapley Engine",
    tint: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    glow: "group-hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]",
    spanCol: "lg:col-span-1",
  },
  {
    icon: UserCheck,
    title: "Attendance and evaluation",
    body: "Marking and marks attach to a review session rather than a group, so R0, P1 and P2 each keep their own record for the same set of students.",
    badge: "Per-Session Marking",
    tint: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    glow: "group-hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]",
    spanCol: "lg:col-span-2",
  },
  {
    icon: BellRing,
    title: "Review scheduling",
    body: "Sessions scheduled against the academic calendar with conflict detection, then 15-day and 7-day reminders queued for 09:00 local dispatch.",
    badge: "Calendar Detection",
    tint: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    glow: "group-hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]",
    spanCol: "lg:col-span-1",
  },
  {
    icon: MessageSquare,
    title: "Email and WhatsApp",
    body: "Dry-run by default and recorded either way. Recipients resolve from the caller's own identity, everyone is BCC'd, and per-faculty SMTP credentials sit encrypted with AES-256-GCM.",
    badge: "AES-256 Encrypted",
    tint: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    glow: "group-hover:shadow-[0_0_30px_rgba(20,184,166,0.2)]",
    spanCol: "lg:col-span-1",
  },
  {
    icon: FileSpreadsheet,
    title: "Formatted reports",
    body: "Nine builders behind one scoped service. Real .xlsx with a frozen filtered header and an About sheet recording the cycle, scope and who generated it.",
    badge: "ExcelJS Workbooks",
    tint: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    glow: "group-hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]",
    spanCol: "lg:col-span-1",
  },
  {
    icon: Upload,
    title: "CSV imports",
    body: "Validate then apply, re-parsed on the server both times so nothing the browser returns is trusted. One error per row keeps a bad spreadsheet readable.",
    badge: "2-Step Validator",
    tint: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    glow: "group-hover:shadow-[0_0_30px_rgba(244,63,94,0.2)]",
    spanCol: "lg:col-span-2",
  },
  {
    icon: Fingerprint,
    title: "Auth that holds",
    body: "HS256 sessions in an HTTP-only cookie, bcrypt at cost 12, and a second role check inside every handler — so a route stays protected even if the proxy matcher changes.",
    badge: "JWT + RBAC",
    tint: "bg-sky-500/10 text-sky-300 border-sky-500/20",
    glow: "group-hover:shadow-[0_0_30px_rgba(56,189,248,0.2)]",
    spanCol: "lg:col-span-1",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Capabilities"
          title="Nine things it does properly"
          body="Each one is wired to a real API route, a real session and a real database write."
        />

        {/* Bento Grid */}
        <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <StaggerItem key={feature.title} className={feature.spanCol || "col-span-1"}>
              <article
                className={`group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-[#0E1322]/80 p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-[#12182B] ${feature.glow}`}
              >
                {/* Background glowing aura spot */}
                <div className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full bg-white/5 blur-2xl transition-all group-hover:bg-white/10" />

                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`inline-flex size-12 items-center justify-center rounded-2xl border ${feature.tint} shadow-inner transition-transform group-hover:scale-110`}
                  >
                    <feature.icon className="size-5" aria-hidden />
                  </span>
                  {feature.badge && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] font-medium text-slate-300">
                      {feature.badge}
                    </span>
                  )}
                </div>

                <h3 className="mt-6 text-lg font-bold tracking-tight text-white group-hover:text-sky-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
                  {feature.body}
                </p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.1} className="mt-12">
          <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-[#121728]/60 px-6 py-3.5 text-center backdrop-blur-md">
            <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
              <Sparkles className="size-3.5 text-sky-400" />
              Uploaded calendars, orientation audio and CSVs are stored in Postgres
              rather than on disk — there is no writable filesystem on serverless.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
