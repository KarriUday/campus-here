"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { CYCLE_COOKIE, MODE_COOKIE } from "@/lib/cycle";

const SIX_MONTHS = 60 * 60 * 24 * 180;

/**
 * Cycle and nav-density are UI preferences, not authorisation, so they live in
 * plain cookies rather than the session token. Every server component reads
 * them through `src/lib/cycle.ts`.
 */
export async function selectCycle(code: string) {
  (await cookies()).set(CYCLE_COOKIE, code, {
    path: "/",
    maxAge: SIX_MONTHS,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}

export async function selectNavMode(mode: "present" | "detailed") {
  (await cookies()).set(MODE_COOKIE, mode, {
    path: "/",
    maxAge: SIX_MONTHS,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
