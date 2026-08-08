import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/rbac";
import { badRequest, resolveCycle } from "@/server/http";

/** Run history — the prototype's "View run history" button, made real. */
export async function GET(request: Request) {
  const auth = await requireApi(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  const runs = await prisma.allocationRun.findMany({
    where: { cycleId: cycle.id },
    orderBy: { startedAt: "desc" },
    take: 20,
    include: { triggeredBy: { select: { name: true } } },
  });

  return NextResponse.json({
    runs: runs.map((run) => ({
      id: run.id,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      durationMs: run.finishedAt
        ? run.finishedAt.getTime() - run.startedAt.getTime()
        : null,
      groupsConsidered: run.groupsConsidered,
      facultyConsidered: run.facultyConsidered,
      allocatedCount: run.allocatedCount,
      unallocatedCount: run.unallocatedCount,
      triggeredBy: run.triggeredBy.name,
      params: run.params,
    })),
  });
}
