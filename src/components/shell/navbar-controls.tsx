"use client";

import { Check, Link2, LogOut, Monitor, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { selectCycle, selectNavMode } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { CycleSummary } from "@/lib/cycle";
import type { NavMode } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function CycleSwitcher({
  cycles,
  selectedCode,
}: {
  cycles: CycleSummary[];
  selectedCode: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2">
      <span className="text-ink-secondary hidden text-xs font-medium sm:inline">
        Cycle
      </span>
      <select
        aria-label="Project cycle"
        value={selectedCode}
        disabled={pending}
        onChange={(event) => {
          const code = event.target.value;
          startTransition(async () => {
            await selectCycle(code);
            router.refresh();
          });
        }}
        className="border-border bg-surface-raised text-ink h-9 max-w-[13rem] rounded-lg border px-2.5 text-sm"
      >
        {cycles.map((cycle) => (
          <option key={cycle.id} value={cycle.code}>
            {cycle.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ModeToggle({ mode }: { mode: NavMode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="hidden items-center gap-2 lg:flex">
      <Monitor className="text-ink-secondary size-4" aria-hidden />
      <select
        aria-label="Navigation density"
        value={mode}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value as NavMode;
          startTransition(async () => {
            await selectNavMode(next);
            router.refresh();
          });
        }}
        className="border-border bg-surface-raised text-ink h-9 rounded-lg border px-2.5 text-sm"
      >
        <option value="detailed">Detailed</option>
        <option value="present">Presentation</option>
      </select>
    </label>
  );
}

/** Copies the current screen's URL with the cycle and mode pinned into it. */
export function ShareLinkButton({
  cycleCode,
  mode,
}: {
  cycleCode: string;
  mode: NavMode;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  return (
    <Button
      variant="secondary"
      size="sm"
      icon={
        copied ? (
          <Check className="size-3.5" aria-hidden />
        ) : (
          <Link2 className="size-3.5" aria-hidden />
        )
      }
      onClick={async () => {
        const url = new URL(window.location.href);
        url.searchParams.set("cycle", cycleCode);
        url.searchParams.set("mode", mode);
        try {
          await navigator.clipboard.writeText(url.toString());
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast({
            tone: "error",
            title: "Could not copy",
            description: "Your browser blocked clipboard access.",
          });
        }
      }}
      className="hidden sm:inline-flex"
    >
      {copied ? "Copied" : "Share link"}
    </Button>
  );
}

export function UserMenu({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="border-border bg-surface-raised hover:bg-surface flex h-9 items-center gap-2 rounded-lg border px-2.5 transition-colors"
      >
        <span className="bg-primary-soft text-primary flex size-6 items-center justify-center rounded-full">
          <User className="size-3.5" aria-hidden />
        </span>
        <span className="text-ink hidden max-w-[9rem] truncate text-sm font-medium sm:inline">
          {name}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="border-border bg-surface-raised shadow-raised absolute right-0 z-50 mt-2 w-60 rounded-xl border p-1.5"
        >
          <div className="px-2.5 py-2">
            <p className="text-ink truncate text-sm font-medium">{name}</p>
            <p className="text-ink-secondary truncate text-xs">{email}</p>
            <span className="bg-primary-soft text-primary mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
              {role}
            </span>
          </div>
          <div className="bg-border-subtle my-1 h-px" />
          <button
            type="button"
            role="menuitem"
            disabled={signingOut}
            onClick={async () => {
              setSigningOut(true);
              await fetch("/api/auth/logout", { method: "POST" });
              router.replace("/login");
              router.refresh();
            }}
            className={cn(
              "text-ink hover:bg-surface flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors",
              signingOut && "opacity-50",
            )}
          >
            <LogOut className="size-4" aria-hidden />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
