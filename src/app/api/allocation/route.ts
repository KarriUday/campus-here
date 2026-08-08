import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/rbac";
import { badRequest, resolveCycle } from "@/server/http";

/** Current allocation state for the cycle. */
export async function GET(request: Request) {
  const auth = await requireApi(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  const [allocations, awaiting] = await Promise.all([
    prisma.allocation.findMany({
      where: { cycleId: cycle.id },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        group: {
          select: {
            code: true,
            avgCgpa: true,
            domain: { select: { name: true } },
          },
        },
        faculty: { select: { id: true, fullName: true } },
      },
    }),
    // Submitted groups the engine has never seen.
    prisma.group.count({
      where: { cycleId: cycle.id, status: "SUBMITTED", allocation: null },
    }),
  ]);

  return NextResponse.json({
    cycle: { id: cycle.id, name: cycle.name },
    awaitingFirstRun: awaiting,
    allocations: allocations.map((row) => ({
      id: row.id,
      groupCode: row.group.code,
      groupId: row.groupId,
      avgCgpa: Number(row.group.avgCgpa),
      domain: row.group.domain?.name ?? null,
      guide: row.faculty?.fullName ?? null,
      guideId: row.facultyId,
      matchedRank: row.matchedRank,
      method: row.method,
      status: row.status,
      unallocatedReason: row.unallocatedReason,
    })),
  });
}
