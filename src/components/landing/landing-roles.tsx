import { GraduationCap, LayoutDashboard, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Stagger, StaggerItem } from "./motion";
import { SectionHeading } from "./section-heading";

type Role = {
  icon: LucideIcon;
  name: string;
  tagline: string;
  duties: string[];
  /** Gradient for the card's top edge — the role's identity colour. */
  edge: string;
  chip: string;
};

const ROLES: Role[] = [
  {
    icon: ShieldCheck,
    name: "Coordinator",
    tagline: "Owns the cycle",
    duties: [
      "Import students, faculty and titles from CSV",
      "Run the allocation engine, preview before committing",
      "Schedule reviews against the academic calendar",
      "Export all nine reports for the whole cycle",
    ],
    edge: "bg-lilac",
    chip: "bg-sky/10 text-sky",
  },
  {
    icon: LayoutDashboard,
    name: "Faculty",
    tagline: "Guides and evaluates",
    duties: [
      "See only the groups actually held",
      "Approve a final title or send it back with a reason",
      "Mark attendance and record marks per session",
      "Mail their own students — never the whole cohort",
    ],
    edge: "bg-coral",
    chip: "bg-primary/10 text-primary",
  },
  {
    icon: GraduationCap,
    name: "Student",
    tagline: "Forms and submits",
    duties: [
      "Create or join a group, one per cycle",
      "Check a title's originality before registering it",
      "Rank six guides, no duplicates across ranks",
      "Track reviews and notifications in a live inbox",
    ],
    edge: "bg-lime",
    chip: "bg-sky/10 text-sky",
  },
];

export function LandingRoles() {
  return (
    <section id="roles" className="scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Role-aware"
          title="Three dashboards, one database"
          body="Scope is derived from the session, never from the query string. A faculty caller asking for cycle-wide data is narrowed, not obliged."
        />

        <Stagger className="mt-14 grid gap-5 lg:grid-cols-3">
          {ROLES.map((role) => (
            <StaggerItem key={role.name} className="h-full">
              <article className="group border-border-subtle bg-surface-raised hover:shadow-raised relative h-full overflow-hidden rounded-3xl border p-7 transition-all duration-300 hover:-translate-y-1">
                <span
                  aria-hidden
                  className={`absolute inset-x-0 top-0 h-1 ${role.edge}`}
                />
                <span
                  className={`inline-flex size-11 items-center justify-center rounded-xl ${role.chip}`}
                >
                  <role.icon className="size-5" aria-hidden />
                </span>
                <h3 className="text-ink mt-5 text-lg font-semibold tracking-tight">
                  {role.name}
                </h3>
                <p className="text-ink-tertiary mt-0.5 text-xs font-medium">
                  {role.tagline}
                </p>
                <ul className="mt-5 space-y-2.5">
                  {role.duties.map((duty) => (
                    <li
                      key={duty}
                      className="text-ink-secondary flex gap-2.5 text-sm leading-relaxed"
                    >
                      <span
                        aria-hidden
                        className={`mt-[0.45rem] size-1.5 shrink-0 rounded-full ${role.edge}`}
                      />
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
