import Link from "next/link";
import { Brand } from "@/components/shell/brand";
import { Marquee } from "@/components/motion/marquee";
import { FadeIn, Reveal } from "@/components/motion/reveal";

/** The four things the system actually does, stated as an index. */
const CAPABILITIES = [
  { n: "01", title: "Ingest", body: "Rosters and previous titles, validated row by row on the server." },
  { n: "02", title: "Form", body: "Groups of four with invariants the database enforces, not the interface." },
  { n: "03", title: "Match", body: "Gale-Shapley over six ranked preferences, stable and reproducible." },
  { n: "04", title: "Review", body: "Scheduling, attendance, evaluation and reminders through the cycle." },
];

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-ink flex items-center justify-between border-b px-6 py-4">
        <Brand />
        <Link
          href="/login"
          className="label-xs border-ink hover:bg-ink hover:text-bg border px-4 py-2 transition-colors"
        >
          Sign in →
        </Link>
      </header>

      <main className="flex-1">
        <section className="border-ink border-b px-6 py-16 sm:py-24 lg:px-12">
          <p className="label-xs text-ink-tertiary mb-8">
            [ ✳ ] &nbsp; Major Project · Mini Project · Internship
          </p>

          <h1 className="display text-[13vw] leading-[0.85] sm:text-[11vw] lg:text-[9.5vw]">
            <Reveal mode="mount">
              <span className="block">Project</span>
            </Reveal>
            <Reveal mode="mount" delay={0.08}>
              <span className="text-primary block">Tracking</span>
            </Reveal>
            <Reveal mode="mount" delay={0.16}>
              <span className="block">&amp; Allocation</span>
            </Reveal>
          </h1>

          <FadeIn delay={0.3}>
            <div className="border-border-subtle mt-14 grid gap-8 border-t pt-8 sm:grid-cols-2">
              <p className="text-ink-secondary max-w-md text-sm leading-relaxed">
                A role-based system for the Department of Computer Science and
                Engineering, BMS Institute of Technology and Management. Group
                formation, title originality, guide allocation, review
                scheduling and reporting — one cycle, end to end.
              </p>
              <div className="flex items-start sm:justify-end">
                <Link
                  href="/login"
                  className="label-xs bg-ink text-bg hover:bg-primary inline-flex items-center gap-3 px-6 py-4 transition-colors"
                >
                  Enter the system →
                </Link>
              </div>
            </div>
          </FadeIn>
        </section>

        <section className="grid sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((item, index) => (
            <FadeIn key={item.n} delay={index * 0.08}>
              <article className="border-border-subtle h-full border-r border-b p-6 lg:p-8">
                <p className="index-num text-primary">[{item.n}]</p>
                <h2 className="display mt-6 text-2xl">{item.title}</h2>
                <p className="text-ink-secondary mt-3 text-sm leading-relaxed">
                  {item.body}
                </p>
              </article>
            </FadeIn>
          ))}
        </section>

        <section className="border-ink border-b py-3">
          <div className="display text-3xl sm:text-5xl">
            <Marquee>
              <span className="flex items-center gap-8">
                <span>Originality</span>
                <span className="text-primary">✳</span>
                <span>Stable Matching</span>
                <span className="text-primary">✳</span>
                <span>Review Cycles</span>
                <span className="text-primary">✳</span>
              </span>
            </Marquee>
          </div>
        </section>
      </main>

      <footer className="label-xs text-ink-tertiary flex flex-wrap justify-between gap-4 px-6 py-6 lg:px-12">
        <span>© 2025—26 BMSIT &amp; M · Dept. of CSE</span>
        <span>Yelahanka, Bengaluru 560119</span>
      </footer>
    </div>
  );
}
