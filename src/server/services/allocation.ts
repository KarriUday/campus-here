import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  allocate,
  findBlockingPair,
  type AllocationInput,
  type AllocationOutcome,
} from "@/lib/allocation-engine";

/**
 * Database wiring around the pure engine in `src/lib/allocation-engine.ts`.
 * The preview and the committed run build the same input and call the same
 * function, so what an admin sees is exactly what gets written.
 */

export class AllocationError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "AllocationError";
  }
}

/** The tie-break rule, recorded on every run so history stays explainable. */
export const TIE_BREAK = [
  "domainMatch",
  "avgCgpa desc",
  "prefsSubmittedAt asc",
  "groupCode asc",
] as const;

async function buildInput(cycleId: string): Promise<{
  input: AllocationInput;
  groupNames: Map<string, string>;
  facultyNames: Map<string, string>;
}> {
  const cycle = await prisma.projectCycle.findUnique({ where: { id: cycleId } });
  if (!cycle) throw new AllocationError("No such project cycle.", 404);

  const [groups, faculty, manual] = await Promise.all([
    prisma.group.findMany({
      where: { cycleId, status: { in: ["SUBMITTED", "ALLOCATED"] } },
      select: {
        id: true,
        code: true,
        avgCgpa: true,
        domainId: true,
        status: true,
        prefsSubmittedAt: true,
        preferences: {
          orderBy: { rank: "asc" },
          select: { facultyId: true },
        },
      },
    }),
    prisma.faculty.findMany({
      where: { isActive: true },
      select: {
        id: true,
        fullName: true,
        capacity: true,
        domains: { select: { id: true } },
      },
    }),
    // Manual assignments are never recomputed; they consume capacity first.
    prisma.allocation.findMany({
      where: { cycleId, method: "MANUAL", status: "ALLOCATED" },
      select: { groupId: true, facultyId: true },
    }),
  ]);

  return {
    input: {
      prefCount: cycle.prefCount,
      groups: groups.map((group) => ({
        id: group.id,
        code: group.code,
        avgCgpa: Number(group.avgCgpa),
        domainId: group.domainId,
        prefsSubmittedAt: group.prefsSubmittedAt?.getTime() ?? null,
        preferences: group.preferences.map((pref) => pref.facultyId),
        submitted: group.status === "SUBMITTED" || group.status === "ALLOCATED",
      })),
      faculty: faculty.map((member) => ({
        id: member.id,
        capacity: member.capacity,
        domainIds: member.domains.map((domain) => domain.id),
      })),
      lockedAssignments: manual
        .filter((row): row is { groupId: string; facultyId: string } =>
          Boolean(row.facultyId),
        )
        .map((row) => ({ groupId: row.groupId, facultyId: row.facultyId })),
    },
    groupNames: new Map(groups.map((g) => [g.id, g.code])),
    facultyNames: new Map(faculty.map((f) => [f.id, f.fullName])),
  };
}

export type AllocationPreview = AllocationOutcome & {
  /** Human-readable rows for the admin screen. */
  rows: Array<{
    groupCode: string;
    facultyName: string;
    rank: number;
  }>;
  unallocatedRows: Array<{ groupCode: string; reason: string }>;
  stable: boolean;
  blockingPair: { groupId: string; facultyId: string } | null;
};

export async function previewAllocation(cycleId: string): Promise<AllocationPreview> {
  const { input, groupNames, facultyNames } = await buildInput(cycleId);
  const outcome = allocate(input);
  const blockingPair = findBlockingPair(input, outcome.matches);

  return {
    ...outcome,
    stable: blockingPair === null,
    blockingPair,
    rows: outcome.matches.map((match) => ({
      groupCode: groupNames.get(match.groupId) ?? match.groupId,
      facultyName: facultyNames.get(match.facultyId) ?? match.facultyId,
      rank: match.rank,
    })),
    unallocatedRows: outcome.unallocated.map((row) => ({
      groupCode: groupNames.get(row.groupId) ?? row.groupId,
      reason: row.reason,
    })),
  };
}

export async function runAllocation(cycleId: string, triggeredById: string) {
  const { input } = await buildInput(cycleId);
  const outcome = allocate(input);
  const blockingPair = findBlockingPair(input, outcome.matches);

  // Refuse to write a matching that fails its own stability check rather than
  // silently persisting a bad allocation.
  if (blockingPair) {
    throw new AllocationError(
      "The computed matching failed its stability check and was not saved.",
      500,
    );
  }

  const startedAt = new Date();
  const lockedGroupIds = new Set(
    (input.lockedAssignments ?? []).map((a) => a.groupId),
  );

  const run = await prisma.$transaction(
    async (tx) => {
      const created = await tx.allocationRun.create({
        data: {
          cycleId,
          triggeredById,
          startedAt,
          groupsConsidered: outcome.stats.groupsConsidered,
          facultyConsidered: outcome.stats.facultyConsidered,
          allocatedCount: outcome.stats.allocated + outcome.stats.locked,
          unallocatedCount: outcome.stats.unallocated,
          params: {
            tieBreak: [...TIE_BREAK],
            prefCount: input.prefCount,
            lockedManualAssignments: outcome.stats.locked,
            proposals: outcome.stats.proposals,
            rankHistogram: outcome.stats.rankHistogram,
          },
        },
      });

      // Clear everything the engine is allowed to decide, leaving manual
      // assignments untouched.
      await tx.allocation.deleteMany({
        where: { cycleId, method: { not: "MANUAL" } },
      });

      if (outcome.matches.length > 0) {
        await tx.allocation.createMany({
          data: outcome.matches.map((match) => ({
            cycleId,
            groupId: match.groupId,
            facultyId: match.facultyId,
            matchedRank: match.rank,
            method: "GALE_SHAPLEY" as const,
            status: "ALLOCATED" as const,
            runId: created.id,
          })),
        });
      }

      if (outcome.unallocated.length > 0) {
        await tx.allocation.createMany({
          data: outcome.unallocated.map((row) => ({
            cycleId,
            groupId: row.groupId,
            facultyId: null,
            method: "GALE_SHAPLEY" as const,
            status: "UNALLOCATED" as const,
            unallocatedReason: row.reason,
            runId: created.id,
          })),
        });
      }

      // Group status follows the outcome.
      const allocatedIds = outcome.matches.map((m) => m.groupId);
      if (allocatedIds.length > 0) {
        await tx.group.updateMany({
          where: { id: { in: allocatedIds } },
          data: { status: "ALLOCATED" },
        });
      }
      const unallocatedIds = outcome.unallocated
        .map((u) => u.groupId)
        .filter((id) => !lockedGroupIds.has(id));
      if (unallocatedIds.length > 0) {
        await tx.group.updateMany({
          where: { id: { in: unallocatedIds }, status: "ALLOCATED" },
          data: { status: "SUBMITTED" },
        });
      }

      return tx.allocationRun.update({
        where: { id: created.id },
        data: { finishedAt: new Date() },
      });
    },
    {
      // Two admins pressing Run at the same moment must not interleave.
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 30_000,
    },
  );

  return { run, outcome, stable: true };
}

/** Admin override for a group the engine could not place. */
export async function assignManually(
  cycleId: string,
  groupId: string,
  facultyId: string,
  assignedById: string,
) {
  return prisma.$transaction(
    async (tx) => {
      const [group, guide] = await Promise.all([
        tx.group.findFirst({ where: { id: groupId, cycleId } }),
        tx.faculty.findUnique({ where: { id: facultyId } }),
      ]);
      if (!group) throw new AllocationError("No such group in this cycle.", 404);
      if (!guide) throw new AllocationError("No such guide.", 404);
      if (!guide.isActive) throw new AllocationError("That guide is inactive.");

      const held = await tx.allocation.count({
        where: {
          cycleId,
          facultyId,
          status: "ALLOCATED",
          groupId: { not: groupId },
        },
      });
      if (held >= guide.capacity) {
        throw new AllocationError(
          `${guide.fullName} already holds ${held} of ${guide.capacity} groups this cycle.`,
        );
      }

      const allocation = await tx.allocation.upsert({
        where: { groupId },
        create: {
          cycleId,
          groupId,
          facultyId,
          method: "MANUAL",
          status: "ALLOCATED",
          assignedById,
        },
        update: {
          facultyId,
          method: "MANUAL",
          status: "ALLOCATED",
          unallocatedReason: null,
          matchedRank: null,
          assignedById,
        },
      });

      await tx.group.update({
        where: { id: groupId },
        data: { status: "ALLOCATED" },
      });

      return allocation;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
