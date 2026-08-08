"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Pills. Solid colour on the cream ground, lifting very slightly on hover —
 * the reference never uses an outline as its primary affordance.
 */
const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white border-primary hover:bg-primary-hover hover:border-primary-hover",
  secondary: "bg-surface-raised text-ink border-border-subtle hover:border-ink",
  danger: "bg-coral text-white border-coral hover:brightness-95",
  ghost:
    "bg-transparent text-ink-secondary border-transparent hover:bg-surface-raised hover:text-ink",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[0.8125rem] gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-13 px-7 text-base gap-2.5",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  /** Lifts slightly on hover. Off for full-width buttons. */
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
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center rounded-full border font-medium whitespace-nowrap",
        "transition-[background-color,color,border-color,transform,filter] duration-200 ease-out",
        // A lift rather than a pull: the hit area never moves out from under
        // the pointer, which a translate toward the cursor can do.
        magnetic && "hover:-translate-y-0.5",
        "disabled:pointer-events-none disabled:opacity-40",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}
