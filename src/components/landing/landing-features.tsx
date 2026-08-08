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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "./motion";
import { SectionHeading } from "./section-heading";

type Feature = {
  icon: LucideIcon;
  title: string;
  body: string;
  /** Solid field for the icon tile; the palette cycles across the nine. */
  tint: string;
};

const FEATURES: Feature[] = [
  {
    icon: Users,
    title: "Group formation",
    body: "Invite-based groups of exactly four. One active group per student per cycle is a database constraint, not a hopeful check — and average CGPA recomputes on every membership change.",
    tint: "bg-lime text-ink",
  },
  {
    icon: ScanSearch,
    title: "Title originality",
    body: "TF-IDF cosine against the corpus at 0.65, plus the strongest of four lexical signals at 0.35. Blocked at 0.95, flagged from 0.80, with the overlapping words shown.",
    tint: "bg-sun text-ink",
  },
  {
    icon: Network,
    title: "Guide allocation",
    body: "Gale-Shapley over six ranked preferences with a hard capacity cap per guide. Stability is verified before anything is written, and a dry run executes the same pure code.",
    tint: "bg-coral text-white",
  },
  {
    icon: UserCheck,
    title: "Attendance and evaluation",
    body: "Marking and marks attach to a review session rather than a group, so R0, P1 and P2 each keep their own record for the same set of students.",
    tint: "bg-sky text-white",
  },
  {
    icon: BellRing,
    title: "Review scheduling",
    body: "Sessions scheduled against the academic calendar with conflict detection, then 15-day and 7-day reminders queued for 09:00 local dispatch.",
    tint: "bg-lilac text-ink",
  },
  {
    icon: MessageSquare,
    title: "Email and WhatsApp",
    body: "Dry-run by default and recorded either way. Recipients resolve from the caller's own identity, everyone is BCC'd, and per-faculty SMTP credentials sit encrypted with AES-256-GCM.",
    tint: "bg-lime text-ink",
  },
  {
    icon: FileSpreadsheet,
    title: "Formatted reports",
    body: "Nine builders behind one scoped service. Real .xlsx with a frozen filtered header and an About sheet recording the cycle, scope and who generated it.",
    tint: "bg-sun text-ink",
  },
  {
    icon: Upload,
    title: "CSV imports",
    body: "Validate then apply, re-parsed on the server both times so nothing the browser returns is trusted. One error per row keeps a bad spreadsheet readable.",
    tint: "bg-coral text-white",
  },
  {
    icon: Fingerprint,
    title: "Auth that holds",
    body: "HS256 sessions in an HTTP-only cookie, bcrypt at cost 12, and a second role check inside every handler — so a route stays protected even if the proxy matcher changes.",
    tint: "bg-sky text-white",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Capabilities"
          title="Nine things it does properly"
          body="Each one is wired to a real API route, a real session and a real database write."
        />

        <Stagger className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <StaggerItem key={feature.title} className="h-full">
              <article className="group border-border-subtle bg-surface-raised hover:border-border hover:shadow-raised h-full rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1">
                <span
                  className={`inline-flex size-11 items-center justify-center rounded-xl ${feature.tint}`}
                >
                  <feature.icon className="size-5" aria-hidden />
                </span>
                <h3 className="text-ink mt-5 text-[15px] font-semibold tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-ink-secondary mt-2 text-sm leading-relaxed">
                  {feature.body}
                </p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.1} className="mt-10">
          <p className="text-ink-tertiary text-center text-sm">
            Uploaded calendars, orientation audio and CSVs are stored in Postgres
            rather than on disk — there is no writable filesystem on serverless.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
