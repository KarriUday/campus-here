"use client";

import { Loader2 } from "lucide-react";
import { useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Square, uppercase, hairline-ruled. Primary inverts to ink on hover rather
 * than merely darkening — the switch is the interaction.
 */
const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white border-primary hover:bg-ink hover:border-ink",
  secondary: "bg-transparent text-ink border-ink hover:bg-ink hover:text-bg",
  danger: "bg-ink text-bg border-ink hover:bg-primary hover:border-primary",
  ghost:
    "bg-transparent text-ink-secondary border-transparent hover:text-ink hover:border-ink",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[0.6875rem] gap-1.5",
  md: "h-10 px-4 text-xs gap-2",
  lg: "h-12 px-6 text-xs gap-2",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  /** Nudges toward the pointer on hover. Off for full-width buttons. */
  magnetic?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  magnetic = true,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);

  // A small pull toward the cursor. Transform only, so it never reflows.
  function onMove(event: React.MouseEvent<HTMLButtonElement>) {
    if (!magnetic || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = event.clientX - (rect.left + rect.width / 2);
    const y = event.clientY - (rect.top + rect.height / 2);
    ref.current.style.transform = `translate(${x * 0.16}px, ${y * 0.22}px)`;
  }

  function onLeave() {
    if (ref.current) ref.current.style.transform = "";
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn(
        "label-xs inline-flex items-center justify-center border font-medium whitespace-nowrap",
        "transition-[background-color,color,border-color,transform] duration-200 ease-out",
        "disabled:pointer-events-none disabled:opacity-40",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}
