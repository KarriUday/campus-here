import Image from "next/image";
import Link from "next/link";
import {
  BookOpenCheck,
  GraduationCap,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { ToastProvider } from "@/components/ui/toast";

const PORTAL_BENEFITS = [
  {
    icon: UsersRound,
    title: "One account, the right workspace",
    copy: "Students, faculty and coordinators are taken directly to their role-specific dashboard.",
  },
  {
    icon: BookOpenCheck,
    title: "Every project milestone in view",
    copy: "Track groups, reviews, approvals and allocations from one dependable portal.",
  },
];

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <ToastProvider>
      <div className="min-h-dvh bg-[#f3f4f8] p-3 sm:p-5 lg:p-7">
        <div className="mx-auto flex min-h-[calc(100dvh-1.5rem)] max-w-[1240px] flex-col overflow-hidden rounded-[26px] border border-[#dedfe8] bg-white shadow-[0_28px_80px_-38px_rgba(25,24,64,0.34)] sm:min-h-[calc(100dvh-2.5rem)] lg:min-h-[calc(100dvh-3.5rem)]">
          <header className="relative z-10 flex min-h-24 items-center border-b border-[#e5e5ec] bg-white px-5 py-4 sm:px-8 lg:px-10">
            <Link
              href="/"
              className="flex min-w-0 items-center gap-3 rounded-lg sm:gap-5"
              aria-label="BMS Institute of Technology and Management home"
            >
              <Image
                src="/assets/bmsit-logo.png"
                alt=""
                width={72}
                height={72}
                className="size-14 shrink-0 object-contain sm:size-[72px]"
                priority
              />

              <span className="h-12 w-px shrink-0 bg-[#b9272f] sm:h-16" />

              <span className="min-w-0">
                <span
                  lang="kn"
                  className="hidden truncate text-[0.68rem] font-semibold text-[#28265f] sm:block"
                >
                  ಬಿ.ಎಂ.ಎಸ್. ಇನ್ಸ್ಟಿಟ್ಯೂಟ್ ಆಫ್ ಟೆಕ್ನಾಲಜಿ &amp; ಮ್ಯಾನೇಜ್ಮೆಂಟ್
                </span>
                <span className="mt-0.5 block text-[0.72rem] leading-tight font-bold tracking-[-0.02em] text-[#b9272f] sm:text-base">
                  BMS INSTITUTE OF TECHNOLOGY &amp; MANAGEMENT
                </span>
                <span className="mt-1 hidden text-[0.66rem] font-medium text-[#4f5060] sm:block">
                  Autonomous Institution under VTU
                </span>
                <span className="mt-0.5 block text-[0.62rem] font-semibold text-[#b9272f] sm:text-[0.7rem]">
                  Yelahanka, Bengaluru — 560119
                </span>
              </span>
            </Link>
          </header>

          <main className="grid flex-1 lg:grid-cols-[0.94fr_1.06fr]">
            <section className="relative hidden overflow-hidden bg-[#242157] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-14 xl:py-14">
              <div
                className="absolute inset-0 opacity-[0.08]"
                aria-hidden="true"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,.65) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.65) 1px, transparent 1px)",
                  backgroundSize: "42px 42px",
                }}
              />
              <div
                className="absolute -right-24 -bottom-32 size-80 rounded-full border-[54px] border-[#b9272f]/80"
                aria-hidden="true"
              />
              <div
                className="absolute top-0 right-12 h-24 w-2 bg-[#b9272f]"
                aria-hidden="true"
              />

              <div className="relative">
                <div className="mb-10 flex items-center gap-3 text-xs font-semibold tracking-[0.16em] text-[#d9d8f1] uppercase">
                  <span className="h-px w-9 bg-[#e04a50]" />
                  CSE Project Portal
                </div>

                <h2 className="max-w-lg text-4xl leading-[1.08] font-semibold tracking-[-0.04em] xl:text-[3.25rem]">
                  Your project journey,
                  <span className="mt-1 block text-[#ffcbce]">clearly organised.</span>
                </h2>
                <p className="mt-6 max-w-md text-sm leading-7 text-[#d0cfe2] xl:text-base">
                  Campus Here brings every major-project decision into one secure,
                  role-aware workspace built for the BMSIT CSE community.
                </p>
              </div>

              <div className="relative mt-12 space-y-4">
                {PORTAL_BENEFITS.map(({ icon: Icon, title, copy }) => (
                  <div
                    key={title}
                    className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#ffb4b8]">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-white">
                        {title}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[#c9c8dc]">
                        {copy}
                      </span>
                    </span>
                  </div>
                ))}
              </div>

              <div className="relative mt-10 flex items-center gap-2 text-xs text-[#b9b8d0]">
                <GraduationCap className="size-4 text-[#ef757a]" aria-hidden="true" />
                Department of Computer Science &amp; Engineering
              </div>
            </section>

            <section className="relative flex items-center justify-center bg-[#fbfbfd] px-5 py-10 sm:px-10 sm:py-14 lg:px-14 xl:px-20">
              <div
                className="absolute top-0 right-0 h-1.5 w-28 bg-[#b9272f] lg:w-40"
                aria-hidden="true"
              />
              <div className="w-full max-w-[440px]">{children}</div>
            </section>
          </main>

          <footer className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-t border-[#e5e5ec] bg-white px-5 py-3 text-[0.68rem] text-[#6d6e7b] sm:px-8 lg:px-10">
            <span>© 2026 BMS Institute of Technology and Management</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-[#28265f]" aria-hidden="true" />
              Secure role-based access
            </span>
          </footer>
        </div>
      </div>
    </ToastProvider>
  );
}
