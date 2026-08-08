import Link from "next/link";
import { Brand } from "@/components/shell/brand";
import { FadeIn, Reveal } from "@/components/motion/reveal";

/** The four things the system actually does, one colour field each. */
const CAPABILITIES = [
  {
    title: "Ingest",
    body: "Rosters and previous titles, validated row by row on the server.",
    field: "bg-sun text-ink",
  },
  {
    title: "Form",
    body: "Groups of four with invariants the database enforces, not the interface.",
    field: "bg-coral text-white",
  },
  {
    title: "Match",
    body: "Gale-Shapley over six ranked preferences, stable and reproducible.",
    field: "bg-sky text-white",
  },
  {
    title: "Review",
    body: "Scheduling, attendance, evaluation and reminders through the cycle.",
    field: "bg-lilac text-ink",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col px-3 pb-3 sm:px-5 sm:pb-5">
      <header className="sticky top-0 z-40 pt-3 sm:pt-5">
        <div className="bg-surface-raised shadow-card flex h-16 items-center justify-between gap-4 rounded-full px-5 sm:px-6">
          <Brand />
          <Link
            href="/login"
            className="bg-primary hover:bg-primary-hover inline-flex h-10 items-center rounded-full px-5 text-sm font-medium text-white transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* The hero is a colour field with the reference's oversized radius. */}
        <section className="section-field bg-lime mt-3 px-6 py-20 text-center sm:mt-5 sm:py-28 lg:py-36">
          <h1 className="display mx-auto max-w-5xl text-[13vw] leading-[0.95] sm:text-[9vw] lg:text-[7.5vw]">
            <Reveal mode="mount">
              <span className="block">Real project</span>
            </Reveal>
            <Reveal mode="mount" delay={0.08}>
              <span className="block">insights</span>
            </Reveal>
          </h1>

          <FadeIn delay={0.25}>
            <p className="text-ink/80 mx-auto mt-8 max-w-xl text-lg">
              One department, one cycle, end to end.
            </p>
            <Link
              href="/login"
              className="bg-ink hover:bg-ink/90 mt-10 inline-flex h-14 items-center rounded-full px-9 text-base font-medium text-white transition-colors"
            >
              Enter the system
            </Link>
          </FadeIn>
        </section>

        <section className="mt-3 grid gap-3 sm:mt-5 sm:gap-5 lg:grid-cols-2">
          {CAPABILITIES.map((item, index) => (
            <FadeIn key={item.title} delay={index * 0.08}>
              <article
                className={`flex h-full flex-col justify-between rounded-2xl p-8 lg:p-10 ${item.field}`}
              >
                <h2 className="display text-3xl lg:text-4xl">{item.title}</h2>
                <p className="mt-6 max-w-sm text-base leading-relaxed opacity-90">
                  {item.body}
                </p>
              </article>
            </FadeIn>
          ))}
        </section>

        <section className="bg-surface-raised mt-3 rounded-2xl px-8 py-16 sm:mt-5 lg:px-16">
          <h2 className="display max-w-3xl text-4xl lg:text-5xl">
            Group formation, title originality, guide allocation, review
            scheduling and <span className="squiggle">reporting</span>
          </h2>
          <p className="text-ink-secondary mt-8 max-w-xl text-base leading-relaxed">
            A role-based system for the Department of Computer Science and
            Engineering, BMS Institute of Technology and Management. Every
            figure on every screen is read from the database.
          </p>
        </section>
      </main>

      <footer className="text-ink-tertiary mt-3 flex flex-wrap justify-between gap-4 px-6 py-8 text-sm sm:mt-5">
        <span>© 2025—26 BMSIT &amp; M · Dept. of CSE</span>
        <span>Yelahanka, Bengaluru 560119</span>
      </footer>
    </div>
  );
}
