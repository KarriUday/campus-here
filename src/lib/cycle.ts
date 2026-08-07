import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { NavMode } from "./navigation";

export const CYCLE_COOKIE = "ch_cycle";
export const MODE_COOKIE = "ch_mode";

export type CycleSummary = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  groupSize: number;
  prefCount: number;
};

export async function listCycles(): Promise<CycleSummary[]> {
  return prisma.projectCycle.findMany({
    orderBy: [{ isActive: "desc" }, { code: "asc" }],
    select: {
      id: true,
      code: true,
      name: true,
      isActive: true,
      groupSize: true,
      prefCount: true,
    },
  });
}

/**
 * The cycle every screen is scoped to.
 *
 * Preference order: the `ch_cycle` cookie set by the switcher, then the cycle
 * flagged active, then the first one that exists. Returns null only when no
 * cycles have been created at all.
 */
export async function getSelectedCycle(): Promise<CycleSummary | null> {
  const cycles = await listCycles();
  if (cycles.length === 0) return null;

  const preferred = (await cookies()).get(CYCLE_COOKIE)?.value;
  return (
    cycles.find((cycle) => cycle.code === preferred) ??
    cycles.find((cycle) => cycle.isActive) ??
    cycles[0]
  );
}

export async function getNavMode(): Promise<NavMode> {
  const value = (await cookies()).get(MODE_COOKIE)?.value;
  return value === "present" ? "present" : "detailed";
}
