"use client";

import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X, ArrowUpRight } from "lucide-react";
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
 * Floating glassmorphic header matching official BMSIT emblem branding & colors.
 */
export function LandingNav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > 12);
  });

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
      <nav
        aria-label="Primary"
        className={cn(
          "mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 rounded-full px-5 transition-all duration-300 sm:px-6",
          "bg-[#131836]/85 backdrop-blur-xl border border-[#5C68A6]/25 shadow-[0_8px_32px_rgba(10,13,27,0.5)]",
          scrolled && "bg-[#0E132D]/95 border-[#7B88D6]/40 shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(75,99,246,0.2)]"
        )}
      >
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="absolute -inset-1 rounded-full bg-[#5C68A6]/30 blur-sm group-hover:bg-[#7B88D6]/50 transition-all" />
            <Image
              src="/assets/bmsit-logo.png"
              alt="BMSIT Logo"
              width={38}
              height={38}
              className="relative object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition-transform group-hover:scale-105"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-white text-[15px] font-bold tracking-tight group-hover:text-[#7B88D6] transition-colors">
              Campus Here
            </span>
            <span className="text-[10px] text-[#A8B2E6] font-mono -mt-1">Dept. of CSE</span>
          </div>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={scrollToAnchor}
              className="text-[#C8CFE6] hover:text-white hover:bg-white/10 rounded-full px-4 py-2 text-sm font-medium transition-all"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="group relative inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-5 text-sm font-semibold text-white transition-all bg-gradient-to-r from-[#3B52E6] via-[#4B63F6] to-[#6074F8] hover:from-[#4B63F6] hover:to-[#778BF8] shadow-[0_0_18px_rgba(75,99,246,0.4)] hover:shadow-[0_0_25px_rgba(75,99,246,0.7)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Sign in</span>
            <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="text-slate-300 hover:text-white hover:bg-white/10 inline-flex size-10 items-center justify-center rounded-full transition-colors md:hidden"
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
            className="mx-auto mt-2 max-w-6xl overflow-hidden rounded-2xl border border-[#5C68A6]/30 bg-[#0E132D]/95 backdrop-blur-2xl md:hidden"
          >
            <div className="flex flex-col px-5 py-4">
              {LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(event) => {
                    setOpen(false);
                    scrollToAnchor(event);
                  }}
                  className="text-slate-300 hover:text-[#7B88D6] border-b border-white/10 py-3 text-sm font-medium last:border-0"
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
