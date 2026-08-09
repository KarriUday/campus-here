"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowUpRight, Menu, Moon, Sun, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { scrollToAnchor } from "./scroll-to-anchor";
import { useLandingTheme } from "./landing-theme";

const LINKS = [
  { href: "#features", label: "Platform" },
  { href: "#flow", label: "Workflow" },
  { href: "#engine", label: "Engines" },
  { href: "#roles", label: "Access" },
];

export function LandingNav() {
  const { scrollY } = useScroll();
  const { theme, toggleTheme } = useLandingTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 16));

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
      <nav
        aria-label="Primary"
        className={cn(
          "mx-auto flex h-16 w-full max-w-[1180px] items-center justify-between gap-4 rounded-2xl border px-3 transition-[background-color,border-color,box-shadow] duration-300 sm:px-4",
          "border-[var(--landing-line)] bg-[color-mix(in_srgb,var(--landing-surface)_90%,transparent)] backdrop-blur-xl",
          scrolled && "shadow-[0_12px_34px_-20px_rgba(18,19,38,0.45)]",
        )}
      >
        <Link href="/" className="flex min-w-0 items-center gap-3 rounded-xl px-1">
          <Image
            src="/assets/bmsit-logo.png"
            alt=""
            width={36}
            height={36}
            className="size-9 shrink-0 object-contain"
            priority
          />
          <span className="min-w-0 border-l border-[var(--landing-line)] pl-3">
            <span className="block text-sm leading-none font-semibold tracking-[-0.02em] text-[var(--landing-text)]">
              Campus Here
            </span>
            <span className="mt-1 block truncate text-[0.62rem] font-medium tracking-[0.08em] text-[var(--landing-muted)] uppercase">
              BMSIT · Department of CSE
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={scrollToAnchor}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-[var(--landing-muted)] transition-colors hover:bg-[var(--landing-soft)] hover:text-[var(--landing-text)]"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-transparent text-[var(--landing-muted)] transition-colors hover:border-[var(--landing-line)] hover:bg-[var(--landing-soft)] hover:text-[var(--landing-text)]"
          >
            {theme === "light" ? (
              <Moon className="size-[18px]" aria-hidden="true" />
            ) : (
              <Sun className="size-[18px]" aria-hidden="true" />
            )}
          </button>
          <Link
            href="/login"
            className="group inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#28265f] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1d1b48]"
          >
            Sign in
            <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex size-10 items-center justify-center rounded-xl text-[var(--landing-muted)] transition-colors hover:bg-[var(--landing-soft)] hover:text-[var(--landing-text)] md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="mx-auto mt-2 max-w-[1180px] overflow-hidden rounded-2xl border border-[var(--landing-line)] bg-[var(--landing-surface)] p-2 shadow-xl md:hidden"
          >
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(event) => {
                  setOpen(false);
                  scrollToAnchor(event);
                }}
                className="block rounded-xl px-4 py-3 text-sm font-medium text-[var(--landing-muted)] hover:bg-[var(--landing-soft)] hover:text-[var(--landing-text)]"
              >
                {link.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
