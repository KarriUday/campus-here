import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names, letting later Tailwind utilities win over
 * earlier conflicting ones (`cn("p-2", "p-4")` -> `"p-4"`).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a CGPA for display: always two decimals, never a bare integer. */
export function formatCgpa(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n.toFixed(2) : "—";
}

/** Average CGPA of a set of members, rounded to two decimals. Never guessed. */
export function averageCgpa(values: Array<number | string>): number {
  const nums = values
    .map((v) => (typeof v === "string" ? Number(v) : v))
    .filter((n): n is number => Number.isFinite(n));
  if (nums.length === 0) return 0;
  const mean = nums.reduce((sum, n) => sum + n, 0) / nums.length;
  return Math.round(mean * 100) / 100;
}

/** Normalise a USN for comparison and storage: trimmed, uppercased. */
export function normalizeUsn(value: string) {
  return value.trim().toUpperCase();
}

/** Normalise an email for comparison and storage: trimmed, lowercased. */
export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}
