"use client";

import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { scrollToAnchor } from "./scroll-to-anchor";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#flow", label: "How it works" },
  { href: "#engine", label: "The engines" },
  { href: "#roles", label: "Roles" },
];

/**
 * Sticky header. Transparent over the hero, then frosts once the page moves —
 * a `useScroll` subscription rather than a scroll listener, so the read stays
 * on Framer's rAF loop and never forces a synchronous layout.
 */
export function LandingNav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > 12);
  });

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-5"
    >
      <nav
        aria-label="Primary"
        className={cn("mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 rounded-full px-5 transition-shadow sm:px-6", "bg-surface-raised", scrolled && "shadow-card")}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/assets/bmsit-logo.png"
            alt=""
            width={32}
            height={32}
            className="rounded-lg grayscale contrast-125"
            priority
          />
          <span className="text-ink text-[15px] font-semibold tracking-tight">
            Campus Here
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={scrollToAnchor}
              className="text-ink-secondary hover:text-ink hover:bg-surface rounded-full px-4 py-2 text-sm font-medium transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="bg-primary hover:bg-primary-hover inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-medium text-white transition-colors"
          >
            Sign in
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="text-ink-secondary hover:bg-surface inline-flex size-10 items-center justify-center rounded-full transition-colors md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="border-border-subtle bg-bg/95 overflow-hidden border-b backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col px-5 pb-4">
              {LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(event) => {
                    setOpen(false);
                    scrollToAnchor(event);
                  }}
                  className="text-ink-secondary hover:text-ink border-border-subtle border-b py-3 text-sm font-medium last:border-0"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
