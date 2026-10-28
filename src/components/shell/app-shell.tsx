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
  hasFaculty?: boolean;
  children: ReactNode;
};

function isActivePath(pathname: string, href: string, roleRoot: string) {
  if (href === roleRoot) return pathname === roleRoot;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Icon-and-label rows; the active one fills as a solid ink pill. */
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
    <nav aria-label="Main" className="flex flex-col gap-1">
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
              "flex items-center gap-3 rounded-full px-4 py-2.5 transition-colors",
              active
                ? "bg-ink text-bg font-medium"
                : "text-ink-secondary hover:bg-surface-raised hover:text-ink",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="flex-1 truncate text-sm leading-tight">
              {navLabel(item, mode)}
            </span>
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
  hasFaculty,
  children,
}: ShellProps) {
  const pathname = usePathname();
  // Closed by the nav links themselves via onNavigate, plus the backdrop and
  // the close button — no route-change effect needed.
  const [drawerOpen, setDrawerOpen] = useState(false);
  const cycleName = cycles.find((c) => c.code === selectedCycleCode)?.name ?? "";

  // Dual-role support: if Admin has a linked Faculty profile and is browsing /faculty/*
  const effectiveRole: Role =
    role === "ADMIN" && hasFaculty && pathname.startsWith("/faculty")
      ? "FACULTY"
      : role;

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only-focusable bg-ink label-xs z-50 m-2 rounded-full px-4 py-2 text-white"
      >
        Skip to content
      </a>

      {/* A white pill floating over the cream, as on the reference. */}
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-5">
        <div className="bg-surface-raised shadow-card flex h-16 items-center gap-4 rounded-full px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="text-ink hover:bg-surface -ml-1 rounded-full p-2 transition-colors lg:hidden"
          >
            <Menu className="size-5" aria-hidden />
          </button>

          <Brand className="min-w-0" markOnlyOnMobile />

          <div className="ml-auto flex items-center gap-2">
            <CycleSwitcher cycles={cycles} selectedCode={selectedCycleCode} />
            <ModeToggle mode={mode} />
            <ShareLinkButton cycleCode={selectedCycleCode} mode={mode} />
            {role === "ADMIN" && hasFaculty && (
              <Link
                href={effectiveRole === "FACULTY" ? "/admin" : "/faculty"}
                className="label-xs hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-3 py-1.5 text-ink hover:bg-surface-raised transition-colors"
                title={effectiveRole === "FACULTY" ? "Switch to Admin View" : "Switch to Teacher View"}
              >
                <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
                {effectiveRole === "FACULTY" ? "Go to Admin" : "Go to Teacher"}
              </Link>
            )}
            <UserMenu
              name={user.name}
              email={user.email}
              role={role}
              canSwitchRole={role === "ADMIN" && Boolean(hasFaculty)}
              activeRole={effectiveRole}
            />
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-[5.75rem] hidden h-[calc(100dvh-5.75rem)] w-64 shrink-0 overflow-y-auto px-4 py-6 lg:block">
          <p className="label-xs text-ink-tertiary mb-3 px-4">
            {cycleName || "No cycle selected"}
          </p>
          <NavList role={effectiveRole} mode={mode} pathname={pathname} />
        </aside>

        <main
          id="main"
          className="min-w-0 flex-1 px-4 py-10 sm:px-8 lg:px-10 lg:py-12"
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
              className="bg-bg absolute inset-y-0 left-0 flex w-80 max-w-[88vw] flex-col overflow-y-auto rounded-r-2xl px-4 py-6"
            >
              <div className="mb-5 flex items-center justify-between px-2">
                <Brand size="sm" showTagline={false} />
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close navigation"
                  className="text-ink hover:bg-surface-raised rounded-full p-2 transition-colors"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>
              <NavList
                role={effectiveRole}
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
