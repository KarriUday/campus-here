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
  type LucideIcon,
} from "lucide-react";
import { Stagger, StaggerItem } from "./motion";
import { SectionHeading } from "./section-heading";

type Feature = {
  icon: LucideIcon;
  title: string;
  body: string;
  system: string;
};

const FEATURES: Feature[] = [
  {
    icon: Users,
    title: "Group formation",
    body: "Invite-based groups of four, with one active group per student and CGPA recomputed on every membership change.",
    system: "Database constrained",
  },
  {
    icon: ScanSearch,
    title: "Title originality",
    body: "TF-IDF and four lexical signals catch near-duplicates, explain overlap and enforce the final score on write.",
    system: "Similarity engine",
  },
  {
    icon: Network,
    title: "Guide allocation",
    body: "Six ranked preferences, hard capacity limits and a deterministic Gale-Shapley result verified for stability.",
    system: "Stable matching",
  },
  {
    icon: UserCheck,
    title: "Attendance & evaluation",
    body: "Attendance and marks belong to each review session, keeping R0, P1 and P2 independently auditable.",
    system: "Session scoped",
  },
  {
    icon: BellRing,
    title: "Review scheduling",
    body: "Academic-calendar conflict checks with reminder queues at 15 and 7 days before every review.",
    system: "Calendar aware",
  },
  {
    icon: MessageSquare,
    title: "Department communication",
    body: "Role-resolved email and WhatsApp delivery, dry-run support and encrypted per-faculty SMTP credentials.",
    system: "Encrypted delivery",
  },
  {
    icon: FileSpreadsheet,
    title: "Formatted reports",
    body: "Nine real Excel builders with filtered headers, frozen rows and an audit sheet recording scope and author.",
    system: "ExcelJS output",
  },
  {
    icon: Upload,
    title: "Safe CSV imports",
    body: "A two-step validate-and-apply flow re-parses server-side and returns readable, row-specific failures.",
    system: "Server validated",
  },
  {
    icon: Fingerprint,
    title: "Role-aware security",
    body: "HTTP-only JWT sessions, bcrypt passwords and a second authorization check inside every handler.",
    system: "JWT + RBAC",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-8 lg:px-6">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow="The platform"
            title="Purpose-built for the work a project cycle creates."
            body="Not a collection of disconnected forms. Each capability hands verified data to the next stage."
          />
          <p className="max-w-xs text-sm leading-6 text-[var(--landing-muted)] lg:text-right">
            Every item below is connected to a real API route, session and
            database operation.
          </p>
        </div>

        <Stagger className="mt-14 grid border-t border-l border-[var(--landing-line)] sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <StaggerItem key={feature.title}>
              <article className="group relative min-h-64 border-r border-b border-[var(--landing-line)] bg-[var(--landing-surface)] p-6 transition-colors hover:bg-[var(--landing-surface-2)] sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <span className="flex size-10 items-center justify-center rounded-xl border border-[var(--landing-line)] bg-[var(--landing-panel-raised)] text-[var(--landing-navy)]">
                    <feature.icon className="size-[18px]" aria-hidden="true" />
                  </span>
                  <span className="mono text-[0.63rem] text-[var(--landing-faint)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-7 text-lg font-semibold tracking-[-0.025em] text-[var(--landing-text)]">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--landing-muted)]">
                  {feature.body}
                </p>
                <p className="absolute bottom-6 left-6 flex items-center gap-2 text-[0.65rem] font-semibold tracking-[0.08em] text-[#b9272f] uppercase sm:left-7">
                  <span className="size-1.5 rounded-full bg-[#b9272f]" />
                  {feature.system}
                </p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
