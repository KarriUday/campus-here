import { CountUp, Stagger, StaggerItem } from "./motion";

const STATS = [
  { value: 30, label: "Working screens", note: "Built on real queries" },
  { value: 26, label: "Data models", note: "With database invariants" },
  { value: 121, label: "Unit tests", note: "Plus browser checks" },
  { value: 9, label: "Report builders", note: "Role-scoped workbooks" },
];

export function LandingStats() {
  return (
    <section className="border-b border-[var(--landing-line)] bg-[var(--landing-surface)]">
      <Stagger className="mx-auto grid w-full max-w-[1180px] grid-cols-2 px-5 sm:px-8 lg:grid-cols-4 lg:px-6">
        {STATS.map((stat, index) => (
          <StaggerItem
            key={stat.label}
            className="relative border-[var(--landing-line)] px-4 py-9 sm:px-7 sm:py-11 lg:border-l last:lg:border-r"
          >
            <span className="absolute top-0 left-4 h-1 w-10 bg-[#b9272f] sm:left-7" aria-hidden="true" />
            <p className="mono text-3xl font-semibold tracking-[-0.05em] text-[var(--landing-text)] sm:text-4xl">
              <CountUp value={stat.value} />
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--landing-text)]">
              {stat.label}
            </p>
            <p className="mt-1 text-xs text-[var(--landing-muted)]">{stat.note}</p>
            <span className="absolute top-4 right-4 text-[0.58rem] font-semibold text-[var(--landing-faint)] sm:right-7">
              0{index + 1}
            </span>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
