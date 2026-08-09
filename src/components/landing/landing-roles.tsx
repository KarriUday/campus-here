import { GraduationCap, LayoutDashboard, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Stagger, StaggerItem } from "./motion";
import { SectionHeading } from "./section-heading";

type Role = {
  icon: LucideIcon;
  name: string;
  tagline: string;
  duties: string[];
  edge: string;
  chip: string;
  badge: string;
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
    edge: "from-purple-500 to-indigo-500",
    chip: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    badge: "Admin Access",
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
    edge: "from-sky-500 to-blue-600",
    chip: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    badge: "Faculty Guide Access",
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
    edge: "from-emerald-500 to-teal-500",
    chip: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    badge: "Student Roster Access",
  },
];

export function LandingRoles() {
  return (
    <section id="roles" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Role-aware"
          title="Three dashboards, one database"
          body="Scope is derived from the session, never from the query string. A faculty caller asking for cycle-wide data is narrowed, not obliged."
        />

        <Stagger className="mt-14 grid gap-6 lg:grid-cols-3">
          {ROLES.map((role) => (
            <StaggerItem key={role.name} className="h-full">
              <article className="group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-[#0E1322]/80 p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-[#12182B]">
                {/* Glowing top line edge */}
                <span
                  aria-hidden
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${role.edge}`}
                />
                
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex size-12 items-center justify-center rounded-2xl border ${role.chip} shadow-inner`}
                  >
                    <role.icon className="size-6" aria-hidden />
                  </span>
                  <span className="font-mono text-[11px] font-medium text-slate-400 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5">
                    {role.badge}
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-bold tracking-tight text-white group-hover:text-sky-300 transition-colors">
                  {role.name}
                </h3>
                <p className="mt-0.5 text-xs font-mono text-slate-400 uppercase tracking-wider">
                  {role.tagline}
                </p>

                <ul className="mt-6 space-y-3">
                  {role.duties.map((duty) => (
                    <li
                      key={duty}
                      className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed"
                    >
                      <span
                        aria-hidden
                        className={`mt-1.5 size-2 shrink-0 rounded-full bg-gradient-to-r ${role.edge}`}
                      />
                      <span>{duty}</span>
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
