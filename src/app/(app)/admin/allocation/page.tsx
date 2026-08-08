import type { Metadata } from "next";
import { Card, CardBody, StatCard } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  AllocationPanel,
  RunHistory,
} from "@/components/admin/allocation-panel";
import { getSelectedCycle } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Allocation" };

export default async function AllocationPage() {
  await requirePage(["ADMIN"]);
  const cycle = await getSelectedCycle();

  if (!cycle) {
    return (
      <>
        <PageHeader title="Allocation" role="Admin" />
        <Card>
          <CardBody>
            <p className="text-ink-secondary text-sm">No cycle selected.</p>
          </CardBody>
        </Card>
      </>
    );
  }

  const cycleId = cycle.id;
  const [submittedCount, allocatedCount, unallocatedGroups, faculty, runs] =
    await Promise.all([
      prisma.group.count({
        where: { cycleId, status: { in: ["SUBMITTED", "ALLOCATED"] } },
      }),
      prisma.allocation.count({ where: { cycleId, status: "ALLOCATED" } }),
      // Groups that submitted but hold no guide: either flagged unallocated by
      // a run, or never included in one.
      prisma.group.findMany({
        where: {
          cycleId,
          status: { in: ["SUBMITTED", "ALLOCATED"] },
          OR: [{ allocation: null }, { allocation: { status: "UNALLOCATED" } }],
        },
        orderBy: { code: "asc" },
        select: {
          id: true,
          code: true,
          avgCgpa: true,
          domain: { select: { name: true } },
          allocation: { select: { unallocatedReason: true } },
        },
      }),
      prisma.faculty.findMany({
        where: { isActive: true },
        orderBy: { fullName: "asc" },
        select: {
          id: true,
          fullName: true,
          capacity: true,
          domains: { select: { name: true } },
          _count: {
            select: { allocations: { where: { cycleId, status: "ALLOCATED" } } },
          },
        },
      }),
      prisma.allocationRun.findMany({
        where: { cycleId },
        orderBy: { startedAt: "desc" },
        take: 10,
        include: { triggeredBy: { select: { name: true } } },
      }),
    ]);

  const totalCapacity = faculty.reduce((sum, f) => sum + f.capacity, 0);

  return (
    <>
      <PageHeader
        title="Allocation"
        subtitle="Stable matching over six ranked preferences, with a manual fallback queue."
        cycleName={cycle.name}
        role="Admin"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Submitted groups"
          value={submittedCount}
          meta="eligible for matching"
          tone="info"
        />
        <StatCard
          label="Allocated"
          value={allocatedCount}
          meta={`of ${totalCapacity} guide places`}
          tone="success"
        />
        <StatCard
          label="Unallocated"
          value={unallocatedGroups.length}
          meta="need a guide"
          tone={unallocatedGroups.length > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Runs recorded"
          value={runs.length}
          meta="most recent first"
        />
      </div>

      <div className="mt-6">
        <AllocationPanel
          submittedCount={submittedCount}
          unallocated={unallocatedGroups.map((group) => ({
            groupId: group.id,
            groupCode: group.code,
            domain: group.domain?.name ?? null,
            avgCgpa: Number(group.avgCgpa),
            reason: group.allocation?.unallocatedReason ?? null,
          }))}
          guides={faculty.map((member) => ({
            id: member.id,
            fullName: member.fullName,
            capacity: member.capacity,
            available: Math.max(0, member.capacity - member._count.allocations),
            domains: member.domains.map((d) => d.name),
          }))}
        />
      </div>

      <RunHistory
        runs={runs.map((run) => ({
          id: run.id,
          startedAt: run.startedAt.toISOString(),
          durationMs: run.finishedAt
            ? run.finishedAt.getTime() - run.startedAt.getTime()
            : null,
          groupsConsidered: run.groupsConsidered,
          allocatedCount: run.allocatedCount,
          unallocatedCount: run.unallocatedCount,
          triggeredBy: run.triggeredBy.name,
        }))}
      />
    </>
  );
}
