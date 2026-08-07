import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-16">
      <div className="border-border bg-surface-raised shadow-card w-full max-w-md rounded-2xl border p-8 text-center">
        <Image
          src="/assets/bmsit-logo.png"
          alt="BMS Institute of Technology and Management"
          width={64}
          height={64}
          className="mx-auto rounded-xl"
          priority
        />
        <h1 className="text-ink mt-6 text-2xl font-semibold tracking-tight">
          Campus Here
        </h1>
        <p className="text-ink-secondary mt-1 text-sm">
          Dept. of CSE · Project Tracking &amp; Allocation
        </p>
        <p className="text-ink-tertiary mt-6 text-sm leading-relaxed">
          Group formation, title originality checks, guide allocation and review
          scheduling for BMS Institute of Technology and Management.
        </p>
        <Link
          href="/login"
          className="bg-primary hover:bg-primary-hover mt-8 inline-flex h-11 w-full items-center justify-center rounded-xl px-5 text-sm font-semibold text-white transition-colors"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
