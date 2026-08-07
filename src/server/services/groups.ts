import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { averageCgpa, normalizeEmail, normalizeUsn } from "@/lib/utils";

/**
 * Group lifecycle.
 *
 * Every rule the prototype only implied is enforced here and, wherever
 * possible, by the database as well:
 *  - one active group per cycle  -> @@unique([cycleId, studentId]) on GroupMember
 *  - no duplicate guide in a ranking -> @@unique([groupId, facultyId])
 *  - average CGPA is arithmetic, never a stored literal
 *  - accepting an invite auto-rejects that student's other pending invites,
 *    which the prototype's own subtitle promised and never did
 */

export class GroupError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "GroupError";
  }
}

/** Prefix for generated group codes, keeping the prototype's shape per cycle. */
const CODE_PREFIX: Record<string, string> = {
  "2025-26-major": "CSE6-A",
  "2025-26-mini": "CSE5-M",
  "2025-26-intern": "CSE7-I",
};

function codePrefix(cycleCode: string) {
  return (
    CODE_PREFIX[cycleCode] ??
    (cycleCode.split("-").pop() ?? "GRP").toUpperCase()
  );
}

type Tx = Prisma.TransactionClient;

/**
 * Serializable isolation for the paths where two students can act at the same
 * instant (two people accepting the last seat). Prisma raises P2034 when the
 * database aborts one of them; retrying is the documented remedy.
 */
async function serializable<T>(fn: (tx: Tx) => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      lastError = error;
      const retryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2034" || error.code === "P2002");
      if (!retryable || attempt === attempts - 1) throw error;
    }
  }
  throw lastError;
}

/**
 * Recompute and persist a group's average CGPA and derived status.
 * Called after every membership change — the number is never typed in.
 */
export async function recomputeGroup(tx: Tx, groupId: string) {
  const group = await tx.group.findUnique({
    where: { id: groupId },
    include: {
      cycle: { select: { groupSize: true } },
      members: { include: { student: { select: { cgpa: true } } } },
    },
  });
  if (!group) return null;

  const avg = averageCgpa(group.members.map((m) => Number(m.student.cgpa)));

  // Only the pre-submission statuses are derived; SUBMITTED and ALLOCATED are
  // deliberate transitions and must not be undone by a membership edit.
  const derived =
    group.status === "SUBMITTED" || group.status === "ALLOCATED"
      ? group.status
      : group.members.length >= group.cycle.groupSize
        ? "READY"
        : "FORMING";

  return tx.group.update({
    where: { id: groupId },
    data: { avgCgpa: avg, status: derived },
    select: { id: true, avgCgpa: true, status: true },
  });
}

async function nextGroupCode(tx: Tx, cycleId: string, cycleCode: string) {
  const prefix = codePrefix(cycleCode);
  const last = await tx.group.findFirst({
    where: { cycleId, code: { startsWith: `${prefix}-` } },
    orderBy: { code: "desc" },
    select: { code: true },
  });
  const lastNumber = last ? Number(last.code.split("-").pop()) : 0;
  const next = Number.isFinite(lastNumber) ? lastNumber + 1 : 1;
  return `${prefix}-${String(next).padStart(3, "0")}`;
}

async function assertEnrolled(tx: Tx, studentId: string, cycleId: string) {
  const enrolled = await tx.studentCycle.findUnique({
    where: { studentId_cycleId: { studentId, cycleId } },
  });
  if (!enrolled) {
    throw new GroupError("You are not enrolled in this project cycle.", 403);
  }
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createGroup(studentId: string, cycleId: string) {
  return serializable(async (tx) => {
    const cycle = await tx.projectCycle.findUnique({ where: { id: cycleId } });
    if (!cycle) throw new GroupError("No such project cycle.", 404);

    await assertEnrolled(tx, studentId, cycleId);

    const existing = await tx.groupMember.findUnique({
      where: { cycleId_studentId: { cycleId, studentId } },
      include: { group: { select: { code: true } } },
    });
    if (existing) {
      throw new GroupError(
        `You are already in group ${existing.group.code} for this cycle.`,
      );
    }

    const group = await tx.group.create({
      data: {
        cycleId,
        code: await nextGroupCode(tx, cycleId, cycle.code),
        status: "FORMING",
        leaderId: studentId,
        members: { create: { studentId, cycleId, role: "LEADER" } },
      },
    });

    await recomputeGroup(tx, group.id);
    return group;
  });
}

// ---------------------------------------------------------------------------
// Invites
// ---------------------------------------------------------------------------

export async function inviteToGroup(
  actingStudentId: string,
  groupId: string,
  identifier: string,
) {
  return serializable(async (tx) => {
    const group = await tx.group.findUnique({
      where: { id: groupId },
      include: {
        cycle: { select: { id: true, groupSize: true } },
        members: { select: { studentId: true } },
        invites: { where: { status: "PENDING" }, select: { id: true } },
      },
    });
    if (!group) throw new GroupError("No such group.", 404);

    if (!group.members.some((m) => m.studentId === actingStudentId)) {
      throw new GroupError("You are not a member of this group.", 403);
    }
    if (group.lockedAt) {
      throw new GroupError("This group is locked and can no longer change.");
    }

    // Members plus outstanding invites cannot exceed the group size, so a
    // burst of acceptances can never overfill the group.
    const committed = group.members.length + group.invites.length;
    if (committed >= group.cycle.groupSize) {
      throw new GroupError(
        `This group already has ${group.members.length} member(s) and ${group.invites.length} pending invite(s), which fills all ${group.cycle.groupSize} places.`,
      );
    }

    const value = identifier.trim();
    const target = await tx.student.findFirst({
      where: value.includes("@")
        ? { email: normalizeEmail(value) }
        : { usn: normalizeUsn(value) },
    });
    if (!target) throw new GroupError("No student found with that USN or email.", 404);
    if (target.id === actingStudentId) {
      throw new GroupError("You cannot invite yourself.");
    }

    await assertEnrolled(tx, target.id, group.cycleId);

    const alreadyGrouped = await tx.groupMember.findUnique({
      where: { cycleId_studentId: { cycleId: group.cycleId, studentId: target.id } },
    });
    if (alreadyGrouped) {
      throw new GroupError(`${target.fullName} is already in a group this cycle.`);
    }

    // Re-inviting someone who previously declined reopens the same row.
    const invite = await tx.groupInvite.upsert({
      where: { groupId_toStudentId: { groupId, toStudentId: target.id } },
      create: {
        groupId,
        cycleId: group.cycleId,
        fromStudentId: actingStudentId,
        toStudentId: target.id,
        status: "PENDING",
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      update: {
        status: "PENDING",
        fromStudentId: actingStudentId,
        respondedAt: null,
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    });

    return { invite, student: target };
  });
}

export async function acceptInvite(studentId: string, inviteId: string) {
  return serializable(async (tx) => {
    const invite = await tx.groupInvite.findUnique({
      where: { id: inviteId },
      include: {
        group: {
          include: {
            cycle: { select: { groupSize: true } },
            members: { select: { id: true } },
          },
        },
      },
    });
    if (!invite) throw new GroupError("No such invite.", 404);
    if (invite.toStudentId !== studentId) {
      throw new GroupError("This invite is not addressed to you.", 403);
    }
    if (invite.status !== "PENDING") {
      throw new GroupError(`This invite was already ${invite.status.toLowerCase()}.`);
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      await tx.groupInvite.update({
        where: { id: inviteId },
        data: { status: "EXPIRED" },
      });
      throw new GroupError("This invite has expired.");
    }
    if (invite.group.lockedAt) {
      throw new GroupError("That group is locked and can no longer change.");
    }

    const alreadyGrouped = await tx.groupMember.findUnique({
      where: { cycleId_studentId: { cycleId: invite.cycleId, studentId } },
    });
    if (alreadyGrouped) {
      throw new GroupError("You are already in a group for this cycle.");
    }

    if (invite.group.members.length >= invite.group.cycle.groupSize) {
      throw new GroupError(
        `That group is already full (${invite.group.cycle.groupSize} members).`,
      );
    }

    await tx.groupMember.create({
      data: {
        groupId: invite.groupId,
        studentId,
        cycleId: invite.cycleId,
        role: "MEMBER",
      },
    });

    await tx.groupInvite.update({
      where: { id: inviteId },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    });

    // Joining one group makes every other outstanding invite moot.
    const superseded = await tx.groupInvite.updateMany({
      where: {
        toStudentId: studentId,
        cycleId: invite.cycleId,
        status: "PENDING",
        id: { not: inviteId },
      },
      data: { status: "REJECTED", respondedAt: new Date() },
    });

    const group = await recomputeGroup(tx, invite.groupId);
    return { group, autoRejected: superseded.count };
  });
}

export async function rejectInvite(studentId: string, inviteId: string) {
  const invite = await prisma.groupInvite.findUnique({ where: { id: inviteId } });
  if (!invite) throw new GroupError("No such invite.", 404);
  if (invite.toStudentId !== studentId) {
    throw new GroupError("This invite is not addressed to you.", 403);
  }
  if (invite.status !== "PENDING") {
    throw new GroupError(`This invite was already ${invite.status.toLowerCase()}.`);
  }

  return prisma.groupInvite.update({
    where: { id: inviteId },
    data: { status: "REJECTED", respondedAt: new Date() },
  });
}

export async function leaveGroup(studentId: string, groupId: string) {
  return serializable(async (tx) => {
    const group = await tx.group.findUnique({
      where: { id: groupId },
      include: { members: { orderBy: { joinedAt: "asc" } } },
    });
    if (!group) throw new GroupError("No such group.", 404);
    if (group.lockedAt) {
      throw new GroupError("This group is locked and can no longer change.");
    }

    const membership = group.members.find((m) => m.studentId === studentId);
    if (!membership) throw new GroupError("You are not in this group.", 403);

    await tx.groupMember.delete({ where: { id: membership.id } });
    const remaining = group.members.filter((m) => m.studentId !== studentId);

    // Last member out disbands the group rather than leaving an orphan row.
    if (remaining.length === 0) {
      await tx.group.delete({ where: { id: groupId } });
      return { disbanded: true };
    }

    // Leadership passes to the longest-standing remaining member.
    if (group.leaderId === studentId) {
      await tx.group.update({
        where: { id: groupId },
        data: { leaderId: remaining[0].studentId },
      });
      await tx.groupMember.update({
        where: { id: remaining[0].id },
        data: { role: "LEADER" },
      });
    }

    await recomputeGroup(tx, groupId);
    return { disbanded: false };
  });
}

// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------

export async function setPreferences(
  studentId: string,
  groupId: string,
  facultyIds: string[],
) {
  return serializable(async (tx) => {
    const group = await tx.group.findUnique({
      where: { id: groupId },
      include: {
        cycle: { select: { prefCount: true } },
        members: { select: { studentId: true } },
      },
    });
    if (!group) throw new GroupError("No such group.", 404);
    if (!group.members.some((m) => m.studentId === studentId)) {
      throw new GroupError("You are not a member of this group.", 403);
    }
    if (group.lockedAt) {
      throw new GroupError("This group is locked and can no longer change.");
    }

    const expected = group.cycle.prefCount;
    if (facultyIds.length !== expected) {
      throw new GroupError(`Select exactly ${expected} guides — you chose ${facultyIds.length}.`);
    }
    if (new Set(facultyIds).size !== facultyIds.length) {
      throw new GroupError("Each guide may only be ranked once.");
    }

    const found = await tx.faculty.findMany({
      where: { id: { in: facultyIds }, isActive: true },
      select: { id: true },
    });
    if (found.length !== facultyIds.length) {
      throw new GroupError("One or more selected guides are unavailable.");
    }

    // Replace wholesale: a partial update could leave a stale rank behind.
    await tx.guidePreference.deleteMany({ where: { groupId } });
    await tx.guidePreference.createMany({
      data: facultyIds.map((facultyId, index) => ({
        groupId,
        facultyId,
        rank: index + 1,
      })),
    });

    return tx.guidePreference.findMany({
      where: { groupId },
      orderBy: { rank: "asc" },
      include: { faculty: { select: { id: true, fullName: true } } },
    });
  });
}

// ---------------------------------------------------------------------------
// Submit
// ---------------------------------------------------------------------------

export async function submitGroup(studentId: string, groupId: string) {
  return serializable(async (tx) => {
    const group = await tx.group.findUnique({
      where: { id: groupId },
      include: {
        cycle: { select: { groupSize: true, prefCount: true } },
        members: { include: { student: { select: { cgpa: true } } } },
        preferences: { select: { id: true } },
        title: { select: { id: true, problemStatement: true } },
      },
    });
    if (!group) throw new GroupError("No such group.", 404);
    if (group.leaderId !== studentId) {
      throw new GroupError("Only the group leader can submit.", 403);
    }
    if (group.lockedAt) throw new GroupError("This group has already been submitted.");

    const blockers: string[] = [];
    if (group.members.length !== group.cycle.groupSize) {
      blockers.push(
        `the group needs exactly ${group.cycle.groupSize} members (currently ${group.members.length})`,
      );
    }
    if (!group.domainId) blockers.push("a domain must be chosen");
    if (!group.title) blockers.push("a project title must be registered");
    else if (!group.title.problemStatement?.trim()) {
      blockers.push("the problem statement is empty");
    }
    if (group.preferences.length !== group.cycle.prefCount) {
      blockers.push(
        `${group.cycle.prefCount} guide preferences are required (currently ${group.preferences.length})`,
      );
    }

    if (blockers.length > 0) {
      throw new GroupError(`Cannot submit yet: ${blockers.join("; ")}.`);
    }

    const now = new Date();
    return tx.group.update({
      where: { id: groupId },
      data: {
        status: "SUBMITTED",
        prefsSubmittedAt: now,
        lockedAt: now,
        avgCgpa: averageCgpa(group.members.map((m) => Number(m.student.cgpa))),
      },
      select: { id: true, code: true, status: true, lockedAt: true },
    });
  });
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** The signed-in student's group for a cycle, with everything the UI needs. */
export function findMyGroup(studentId: string, cycleId: string) {
  return prisma.group.findFirst({
    where: { cycleId, members: { some: { studentId } } },
    include: {
      domain: { select: { id: true, name: true } },
      members: {
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
        include: {
          student: {
            select: { id: true, usn: true, fullName: true, email: true, cgpa: true },
          },
        },
      },
      preferences: {
        orderBy: { rank: "asc" },
        include: {
          faculty: {
            select: {
              id: true,
              fullName: true,
              designation: true,
              domains: { select: { name: true } },
            },
          },
        },
      },
      title: true,
      allocation: { include: { faculty: { select: { fullName: true } } } },
      invites: {
        where: { status: "PENDING" },
        include: {
          toStudent: { select: { usn: true, fullName: true } },
        },
      },
      sessions: { orderBy: { scheduledAt: "asc" } },
    },
  });
}
