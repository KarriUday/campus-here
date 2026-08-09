import {
  Check,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Stagger, StaggerItem } from "./motion";
import { SectionHeading } from "./section-heading";

type Role = {
  icon: LucideIcon;
  name: string;
  scope: string;
  description: string;
  duties: string[];
};

const ROLES: Role[] = [
  {
    icon: ShieldCheck,
    name: "Coordinator",
    scope: "Cycle-wide control",
    description: "Runs the department's operating workflow and owns final administrative decisions.",
    duties: [
      "Import rosters and approved title corpora",
      "Preview and commit guide allocation",
      "Schedule reviews and export cycle reports",
    ],
  },
  {
    icon: LayoutDashboard,
    name: "Faculty",
    scope: "Assigned groups only",
    description: "Guides, reviews and communicates within an automatically narrowed academic scope.",
    duties: [
      "Approve or return final project titles",
      "Record attendance and evaluation marks",
      "Contact the students they actually guide",
    ],
  },
  {
    icon: GraduationCap,
    name: "Student",
    scope: "Personal project workspace",
    description: "Forms a group, submits the proposal and follows every milestone through completion.",
    duties: [
      "Create or join one group per cycle",
      "Check title originality before submission",
      "Rank guides and follow review notifications",
    ],
  },
];

export function LandingRoles() {
  return (
    <section id="roles" className="scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-8 lg:px-6">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <SectionHeading
            eyebrow="Access model"
            title="One platform. Three deliberately different views."
          />
          <p className="max-w-xl text-base leading-7 text-[var(--landing-muted)] lg:justify-self-end">
            Scope comes from the signed session, never a URL parameter. People see
            the information their work requires—and no broader dataset.
          </p>
        </div>

        <Stagger className="mt-14 grid gap-4 lg:grid-cols-3">
          {ROLES.map((role, index) => (
            <StaggerItem key={role.name} className="h-full">
              <article className="relative flex h-full flex-col overflow-hidden rounded-[20px] border border-[var(--landing-line)] bg-[var(--landing-surface)] p-6 shadow-[var(--landing-shadow)] sm:p-7">
                <span
                  className={index === 0 ? "absolute inset-y-0 left-0 w-1 bg-[#b9272f]" : "absolute inset-x-0 top-0 h-1 bg-[#28265f]"}
                  aria-hidden="true"
                />
                <div className="flex items-start justify-between gap-5">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-[var(--landing-navy-soft)] text-[var(--landing-navy)]">
                    <role.icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="mono text-[0.62rem] text-[var(--landing-faint)]">
                    ACCESS / 0{index + 1}
                  </span>
                </div>

                <h3 className="mt-7 text-xl font-semibold tracking-[-0.03em] text-[var(--landing-text)]">
                  {role.name}
                </h3>
                <p className="mt-1 text-xs font-semibold tracking-[0.08em] text-[#b9272f] uppercase">
                  {role.scope}
                </p>
                <p className="mt-4 text-sm leading-6 text-[var(--landing-muted)]">
                  {role.description}
                </p>

                <ul className="mt-7 space-y-3 border-t border-[var(--landing-line)] pt-6">
                  {role.duties.map((duty) => (
                    <li key={duty} className="flex items-start gap-3 text-sm leading-5 text-[var(--landing-text)]">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-[#b9272f]" aria-hidden="true" />
                      {duty}
                    </li>
                  ))}
                </ul>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
