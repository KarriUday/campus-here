import { ArrowRight, Lock } from "lucide-react";
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
      <section className="py-16 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <Reveal>
            <div className="relative overflow-hidden rounded-[32px] sm:rounded-[44px] border border-[#5C68A6]/30 bg-gradient-to-r from-[#0E132D] via-[#151C42] to-[#0E132D] px-6 py-16 text-center sm:px-12 sm:py-20 shadow-[0_25px_80px_rgba(0,0,0,0.7)]">
              {/* Radial glow background */}
              <div
                aria-hidden
                className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[650px] rounded-full bg-[#3B52E6]/25 blur-[140px]"
              />

              <div className="relative z-10 mx-auto max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7B88D6]/40 bg-[#161D42]/90 px-4 py-1.5 text-xs font-semibold text-[#C8D1F8] backdrop-blur-md">
                  <Lock className="size-3.5" />
                  Role-Aware JWT Authentication
                </span>

                <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl text-balance">
                  Ready when your cycle is
                </h2>
                <p className="mx-auto mt-4 text-base leading-relaxed text-[#C8CFE6] text-pretty sm:text-lg">
                  Sign in with the account issued by your department. You will land
                  on the dashboard for your role — coordinator, faculty or student.
                </p>
                <Link
                  href="/login"
                  className="group relative mt-9 inline-flex h-13 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#3B52E6] via-[#4B63F6] to-[#6074F8] px-9 text-[15px] font-bold text-white transition-all shadow-[0_0_28px_rgba(75,99,246,0.45)] hover:shadow-[0_0_38px_rgba(75,99,246,0.75)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Sign in</span>
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                </Link>
                <p className="mt-6 text-xs text-[#A8B2E6]">
                  Trouble signing in? Use “Forgot your password?” on the sign-in
                  screen — reset links expire in 30 minutes.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-16 text-center">
              <p className="font-mono text-[11px] font-semibold tracking-widest text-[#A8B2E6] uppercase">
                Built with
              </p>
              <ul className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                {STACK.map((tech) => (
                  <li
                    key={tech}
                    className="rounded-full border border-[#5C68A6]/25 bg-[#121838] px-4 py-1.5 font-mono text-xs font-medium text-[#C8CFE6] shadow-sm hover:border-[#7B88D6]/50 hover:text-white transition-colors"
                  >
                    {tech}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-white/10 py-10 bg-[#080B1A]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-5 text-center sm:flex-row sm:px-8 sm:text-left">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/bmsit-logo.png"
              alt="BMSIT Logo"
              width={36}
              height={36}
              className="object-contain"
            />
            <div>
              <p className="text-sm font-bold text-white">Campus Here</p>
              <p className="text-xs text-[#A8B2E6] font-mono">
                Dept. of CSE · Project Tracking &amp; Allocation
              </p>
            </div>
          </div>
          <p className="text-xs text-[#A8B2E6] font-mono">
            BMS Institute of Technology and Management · Yelahanka, Bengaluru
          </p>
        </div>
      </footer>
    </>
  );
}
