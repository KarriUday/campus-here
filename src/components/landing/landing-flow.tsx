import {
  ClipboardCheck,
  Network,
  ScanSearch,
  Upload,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "./motion";
import { SectionHeading } from "./section-heading";

const STEPS: Array<{
  step: string;
  icon: LucideIcon;
  title: string;
  body: string;
  output: string;
}> = [
  {
    step: "01",
    icon: Upload,
    title: "Import the cohort",
    body: "Student and faculty CSVs are checked for malformed values, duplicates and missing identities before any row is written.",
    output: "Verified roster",
  },
  {
    step: "02",
    icon: Users,
    title: "Form and lock groups",
    body: "Students accept invitations into groups of four. Submitting locks membership, title and guide preferences together.",
    output: "Eligible groups",
  },
  {
    step: "03",
    icon: ScanSearch,
    title: "Clear originality",
    body: "The server checks every submitted title against the corpus and blocks scores at or above the duplication threshold.",
    output: "Approved proposals",
  },
  {
    step: "04",
    icon: Network,
    title: "Allocate guides",
    body: "Groups propose down ranked preferences while guide capacity and deterministic tie-break rules shape the stable result.",
    output: "Stable allocation",
  },
  {
    step: "05",
    icon: ClipboardCheck,
    title: "Run reviews and report",
    body: "The department schedules reviews, records attendance and marks, sends reminders and exports the final audit trail.",
    output: "Completed cycle",
  },
];

export function LandingFlow() {
  return (
    <section id="flow" className="scroll-mt-24 border-y border-[var(--landing-line)] bg-[var(--landing-surface)] py-24 sm:py-32">
      <div className="mx-auto grid w-full max-w-[1180px] gap-14 px-5 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20 lg:px-6">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            eyebrow="Operating sequence"
            title="A cycle that moves forward on verified state."
            body="Five handoffs. Each stage produces a dependable input for the next, so coordinators know exactly where work is held up."
          />
          <div className="mt-9 border-l-2 border-[#b9272f] pl-5">
            <p className="text-xs font-semibold tracking-[0.12em] text-[var(--landing-faint)] uppercase">
              Built-in principle
            </p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--landing-muted)]">
              Preview first, commit second. The browser never authorizes a write
              the server has not independently checked.
            </p>
          </div>
        </div>

        <ol className="border-t border-[var(--landing-line)]">
          {STEPS.map((item) => (
            <li key={item.step} className="border-b border-[var(--landing-line)]">
              <Reveal y={18} className="grid gap-5 py-8 sm:grid-cols-[52px_1fr_auto] sm:items-start sm:gap-6">
                <span className="mono text-sm font-semibold text-[#b9272f]">{item.step}</span>
                <div>
                  <div className="flex items-center gap-3">
                    <item.icon className="size-[18px] text-[var(--landing-navy)]" aria-hidden="true" />
                    <h3 className="text-lg font-semibold tracking-[-0.025em] text-[var(--landing-text)]">
                      {item.title}
                    </h3>
                  </div>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--landing-muted)]">
                    {item.body}
                  </p>
                </div>
                <span className="w-fit rounded-lg border border-[var(--landing-line)] bg-[var(--landing-panel-raised)] px-3 py-1.5 text-[0.62rem] font-semibold tracking-[0.08em] text-[var(--landing-muted)] uppercase sm:mt-0.5">
                  {item.output}
                </span>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
