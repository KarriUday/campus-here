import { CountUp, Stagger, StaggerItem } from "./motion";

/** Figures from the seeded demo cohort and the shipped codebase. */
const STATS = [
  { value: 30, suffix: "", label: "Screens", note: "all on real queries" },
  { value: 26, suffix: "", label: "Data models", note: "12 DB invariants" },
  { value: 121, suffix: "", label: "Unit tests", note: "plus 18 browser checks" },
  { value: 9, suffix: "", label: "Report builders", note: "role-scoped .xlsx" },
];

export function LandingStats() {
  return (
    <section className="border-border-subtle border-y bg-surface/60">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <Stagger className="grid grid-cols-2 gap-px lg:grid-cols-4">
          {STATS.map((stat) => (
            <StaggerItem key={stat.label} className="px-2 py-10 text-center sm:py-12">
              <p className="text-ink text-4xl font-semibold tracking-tight sm:text-5xl">
                <CountUp value={stat.value} />
                {stat.suffix}
              </p>
              <p className="text-ink mt-2 text-sm font-semibold">{stat.label}</p>
              <p className="text-ink-tertiary mt-0.5 text-xs">{stat.note}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
