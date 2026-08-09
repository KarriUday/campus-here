import { CountUp, Stagger, StaggerItem } from "./motion";

/** Figures from the seeded demo cohort and the shipped codebase. */
const STATS = [
  { value: 30, suffix: "", label: "Screens", note: "all on real queries", tint: "from-[#7B88D6] to-[#6074F8]" },
  { value: 26, suffix: "", label: "Data models", note: "12 DB invariants", tint: "from-[#A8B2E6] to-[#8B98E6]" },
  { value: 121, suffix: "", label: "Unit tests", note: "plus 18 browser checks", tint: "from-[#4B63F6] to-[#3B52E6]" },
  { value: 9, suffix: "", label: "Report builders", note: "role-scoped .xlsx", tint: "from-[#6074F8] to-[#94A2F2]" },
];

export function LandingStats() {
  return (
    <section className="relative rounded-[28px] sm:rounded-[36px] border border-[#5C68A6]/30 bg-[#0E132D]/90 backdrop-blur-xl px-5 py-8 sm:px-8 sm:py-10 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
      <div className="mx-auto w-full max-w-6xl">
        <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((stat) => (
            <StaggerItem
              key={stat.label}
              className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#141B3E]/70 p-6 text-center transition-all hover:border-[#7B88D6]/40 hover:bg-[#18214A]/90"
            >
              <div className="pointer-events-none absolute -top-12 -right-12 size-24 bg-[#3B52E6]/10 blur-xl rounded-full" />
              <p className={`bg-gradient-to-r ${stat.tint} bg-clip-text text-transparent text-4xl font-extrabold tracking-tight sm:text-5xl font-mono`}>
                <CountUp value={stat.value} />
                {stat.suffix}
              </p>
              <p className="mt-2 text-sm font-bold text-white">{stat.label}</p>
              <p className="mt-0.5 text-xs text-[#A8B2E6]">{stat.note}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
