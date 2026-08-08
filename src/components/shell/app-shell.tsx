"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Brand } from "@/components/shell/brand";
import {
  CycleSwitcher,
  ModeToggle,
  ShareLinkButton,
  UserMenu,
} from "@/components/shell/navbar-controls";
import { Marquee } from "@/components/motion/marquee";
import { PageTransition } from "@/components/motion/page-transition";
import type { CycleSummary } from "@/lib/cycle";
import { navItemsFor, navLabel, type NavMode } from "@/lib/navigation";
import type { Role } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

type ShellProps = {
  role: Role;
  mode: NavMode;
  cycles: CycleSummary[];
  selectedCycleCode: string;
  user: { name: string; email: string };
  children: ReactNode;
};

function isActivePath(pathname: string, href: string, roleRoot: string) {
  if (href === roleRoot) return pathname === roleRoot;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Numbered index navigation — [01], [02] — rather than icon-and-label rows.
 * The icon stays as a quiet secondary cue at the right edge.
 */
function NavList({
  role,
  mode,
  pathname,
  onNavigate,
}: {
  role: Role;
  mode: NavMode;
  pathname: string;
  onNavigate?: () => void;
}) {
  const items = navItemsFor(role, mode);
  const roleRoot = items[0]?.href ?? "/";

  return (
    <nav aria-label="Main" className="flex flex-col">
      {items.map((item, index) => {
        const active = isActivePath(pathname, item.href, roleRoot);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group border-border-subtle flex items-center gap-3 border-b py-3 transition-colors",
              active ? "text-ink" : "text-ink-secondary hover:text-ink",
            )}
          >
            <span
              className={cn(
                "index-num shrink-0 transition-colors",
                active && "text-primary",
              )}
            >
              [{String(index + 1).padStart(2, "0")}]
            </span>
            <span
              className={cn(
                "flex-1 truncate text-[0.8125rem] leading-tight",
                active && "font-semibold",
              )}
            >
              {navLabel(item, mode)}
            </span>
            <Icon
              className={cn(
                "size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-60",
                active && "text-primary opacity-100",
              )}
              aria-hidden
            />
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  role,
  mode,
  cycles,
  selectedCycleCode,
  user,
  children,
}: ShellProps) {
  const pathname = usePathname();
  // Closed by the nav links themselves via onNavigate, plus the backdrop and
  // the close button — no route-change effect needed.
  const [drawerOpen, setDrawerOpen] = useState(false);
  const cycleName = cycles.find((c) => c.code === selectedCycleCode)?.name ?? "";

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only-focusable bg-ink label-xs z-50 m-2 px-3 py-2 text-white"
      >
        Skip to content
      </a>

      <header className="border-ink bg-bg/90 sticky top-0 z-40 border-b backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="text-ink hover:text-primary -ml-1 p-2 transition-colors lg:hidden"
          >
            <Menu className="size-5" aria-hidden />
          </button>

          <Brand className="min-w-0" markOnlyOnMobile />

          <div className="ml-auto flex items-center gap-2">
            <CycleSwitcher cycles={cycles} selectedCode={selectedCycleCode} />
            <ModeToggle mode={mode} />
            <ShareLinkButton cycleCode={selectedCycleCode} mode={mode} />
            <UserMenu name={user.name} email={user.email} role={role} />
          </div>
        </div>

        {/* A running strip of context, the way the reference annotates itself. */}
        <div className="border-border-subtle bg-surface label-xs text-ink-tertiary border-t py-1.5">
          <Marquee>
            <span className="flex items-center gap-8">
              <span>{cycleName || "No cycle selected"}</span>
              <span className="text-primary">✳</span>
              <span>BMS Institute of Technology and Management</span>
              <span className="text-primary">✳</span>
              <span>Department of Computer Science and Engineering</span>
              <span className="text-primary">✳</span>
              <span>Project Tracking &amp; Allocation</span>
              <span className="text-primary">✳</span>
              <span>Signed in as {role}</span>
              <span className="text-primary">✳</span>
            </span>
          </Marquee>
        </div>
      </header>

      <div className="flex">
        <aside className="border-border sticky top-[6.25rem] hidden h-[calc(100dvh-6.25rem)] w-64 shrink-0 overflow-y-auto border-r px-5 py-6 lg:block">
          <p className="label-xs text-ink-tertiary border-border-subtle mb-1 border-b pb-3">
            Index / {navItemsFor(role, mode).length}
          </p>
          <NavList role={role} mode={mode} pathname={pathname} />
        </aside>

        <main
          id="main"
          className="min-w-0 flex-1 px-4 py-10 sm:px-8 lg:px-12 lg:py-14"
        >
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-ink/30 absolute inset-0"
              onClick={() => setDrawerOpen(false)}
              aria-hidden
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="bg-bg border-ink absolute inset-y-0 left-0 flex w-80 max-w-[88vw] flex-col overflow-y-auto border-r px-5 py-6"
            >
              <div className="border-border-subtle mb-4 flex items-center justify-between border-b pb-4">
                <Brand size="sm" showTagline={false} />
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close navigation"
                  className="text-ink hover:text-primary p-2 transition-colors"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>
              <NavList
                role={role}
                mode={mode}
                pathname={pathname}
                onNavigate={() => setDrawerOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
