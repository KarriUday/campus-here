import { ArrowRight, LockKeyhole } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "./motion";

const STACK = [
  "Next.js 16",
  "React 19",
  "TypeScript",
  "PostgreSQL",
  "Prisma",
  "Tailwind CSS",
];

export function LandingCta() {
  return (
    <>
      <section className="pb-24 sm:pb-32">
        <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-8 lg:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-[24px] bg-[#242157] px-6 py-12 text-white sm:px-10 sm:py-14 lg:px-14 lg:py-16">
              <div className="absolute top-0 right-0 h-1.5 w-40 bg-[#d73b43]" aria-hidden="true" />
              <div className="absolute -right-24 -bottom-36 size-72 rounded-full border-[48px] border-white/[0.05]" aria-hidden="true" />

              <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="flex items-center gap-2.5 text-xs font-semibold tracking-[0.13em] text-[#ffbdc0] uppercase">
                    <LockKeyhole className="size-4" aria-hidden="true" />
                    Department-issued access
                  </p>
                  <h2 className="mt-5 max-w-2xl text-3xl leading-[1.08] font-semibold tracking-[-0.045em] sm:text-4xl lg:text-[3.25rem]">
                    Your role is ready when you sign in.
                  </h2>
                  <p className="mt-5 max-w-2xl text-sm leading-7 text-[#cac9df] sm:text-base">
                    Use the account issued by the department. Campus Here resolves
                    your access securely and opens the correct workspace without a
                    role selector.
                  </p>
                </div>

                <Link
                  href="/login"
                  className="group inline-flex h-13 w-fit items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-[#242157] transition-colors hover:bg-[#f2f1f8]"
                >
                  Continue to sign in
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </Reveal>

          <div className="mt-10 flex flex-col justify-between gap-5 border-b border-[var(--landing-line)] pb-10 sm:flex-row sm:items-center">
            <p className="text-xs font-semibold tracking-[0.12em] text-[var(--landing-faint)] uppercase">
              Built on a production-ready stack
            </p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {STACK.map((technology) => (
                <li key={technology} className="mono text-[0.68rem] text-[var(--landing-muted)]">
                  {technology}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--landing-line)] bg-[var(--landing-surface)] py-8">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="flex items-center gap-4">
            <Image
              src="/assets/bmsit-logo.png"
              alt=""
              width={44}
              height={44}
              className="size-11 object-contain"
            />
            <div className="border-l border-[var(--landing-line)] pl-4">
              <p className="text-sm font-semibold text-[var(--landing-text)]">Campus Here</p>
              <p className="mt-1 text-xs text-[var(--landing-muted)]">
                Department of Computer Science &amp; Engineering
              </p>
            </div>
          </div>
          <div className="text-xs leading-5 text-[var(--landing-muted)] lg:text-right">
            <p>BMS Institute of Technology and Management</p>
            <p>Yelahanka, Bengaluru — 560119</p>
          </div>
        </div>
      </footer>
    </>
  );
}
