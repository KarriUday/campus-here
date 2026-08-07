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
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = isActivePath(pathname, item.href, roleRoot);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-primary-soft text-primary font-semibold"
                : "text-ink-secondary hover:bg-surface hover:text-ink",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{navLabel(item, mode)}</span>
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

  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only-focusable bg-primary z-50 m-2 rounded-lg px-3 py-2 text-sm text-white">
        Skip to content
      </a>

      <header className="border-border bg-surface-raised/80 sticky top-0 z-40 border-b backdrop-blur-xl">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="text-ink-secondary hover:bg-surface -ml-1 rounded-lg p-2 transition-colors lg:hidden"
          >
            <Menu className="size-5" aria-hidden />
          </button>

          <Brand className="min-w-0" />

          <div className="ml-auto flex items-center gap-2">
            <CycleSwitcher cycles={cycles} selectedCode={selectedCycleCode} />
            <ModeToggle mode={mode} />
            <ShareLinkButton cycleCode={selectedCycleCode} mode={mode} />
            <UserMenu name={user.name} email={user.email} role={role} />
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="border-border sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 overflow-y-auto border-r px-3 py-4 lg:block">
          <p className="text-ink-tertiary px-3 pb-2 text-[10px] font-semibold tracking-wider uppercase">
            Navigation
          </p>
          <NavList role={role} mode={mode} pathname={pathname} />
        </aside>

        <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/25"
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
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="bg-surface-raised absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto px-3 py-4 shadow-xl"
            >
              <div className="mb-4 flex items-center justify-between px-1">
                <Brand size="sm" showTagline={false} />
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close navigation"
                  className="text-ink-secondary hover:bg-surface rounded-lg p-2 transition-colors"
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
