import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "./motion";

const STACK = [
  "Next.js 16",
  "React 19",
  "TypeScript",
  "PostgreSQL 17",
  "Prisma 7",
  "Tailwind v4",
  "jose · bcrypt",
  "ExcelJS",
  "Nodemailer",
  "Twilio",
];

export function LandingCta() {
  return (
    <>
      <section className="pb-24 sm:pb-32">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] px-6 py-16 text-center sm:px-12 sm:py-20">
              {/* Gradient panel, softened so white text stays comfortably legible. */}
              <div
                aria-hidden
                className="bg-sky absolute inset-0 -z-10"
              />

              <h2 className="text-3xl font-semibold tracking-[-0.02em] text-balance text-white sm:text-4xl">
                Ready when your cycle is
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-pretty text-white/85 sm:text-lg">
                Sign in with the account issued by your department. You will land
                on the dashboard for your role — coordinator, faculty or student.
              </p>
              <Link
                href="/login"
                className="group text-ink mt-9 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-7 text-[15px] font-semibold shadow-lg transition-transform hover:-translate-y-0.5"
              >
                Sign in
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
              <p className="mt-6 text-xs text-white/70">
                Trouble signing in? Use “Forgot your password?” on the sign-in
                screen — reset links expire in 30 minutes.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-14 text-center">
              <p className="text-ink-tertiary text-[11px] font-semibold tracking-[0.14em] uppercase">
                Built with
              </p>
              <ul className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {STACK.map((tech) => (
                  <li
                    key={tech}
                    className="border-border-subtle bg-surface-raised text-ink-secondary rounded-full border px-3.5 py-1.5 text-xs font-medium"
                  >
                    {tech}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-border-subtle border-t py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-5 text-center sm:flex-row sm:px-8 sm:text-left">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/bmsit-logo.png"
              alt=""
              width={32}
              height={32}
              className="rounded-lg"
            />
            <div>
              <p className="text-ink text-sm font-semibold">Campus Here</p>
              <p className="text-ink-tertiary text-xs">
                Dept. of CSE · Project Tracking &amp; Allocation
              </p>
            </div>
          </div>
          <p className="text-ink-tertiary text-xs">
            BMS Institute of Technology and Management · Yelahanka, Bengaluru
          </p>
        </div>
      </footer>
    </>
  );
}
