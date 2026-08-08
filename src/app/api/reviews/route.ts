import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/rbac";
import { badRequest, resolveCycle } from "@/server/http";
import { findConflicts, type ScheduledSlot } from "@/lib/schedule-conflicts";

export async function GET(request: Request) {
  const auth = await requireApi(["ADMIN", "FACULTY"]);
  if (!auth.ok) return auth.response;

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  // A guide sees only their own sessions; an admin sees the whole cycle.
  const facultyScope =
    auth.session.role === "FACULTY" ? { facultyId: auth.session.facultyId } : {};

  const sessions = await prisma.reviewSession.findMany({
    where: { cycleId: cycle.id, ...facultyScope },
    orderBy: { scheduledAt: "asc" },
    include: {
      group: { select: { id: true, code: true, domain: { select: { name: true } } } },
      faculty: { select: { id: true, fullName: true } },
      _count: { select: { attendance: true, evaluations: true } },
    },
  });

  return NextResponse.json({
    sessions: sessions.map((session) => ({
      id: session.id,
      groupId: session.groupId,
      groupCode: session.group.code,
      domain: session.group.domain?.name ?? null,
      phase: session.phase,
      scheduledAt: session.scheduledAt,
      venue: session.venue,
      durationMinutes: session.durationMinutes,
      status: session.status,
      guide: session.faculty?.fullName ?? null,
      guideId: session.facultyId,
      attendanceMarked: session._count.attendance > 0,
      evaluated: session._count.evaluations > 0,
    })),
  });
}

const ScheduleSchema = z.object({
  groupId: z.string().min(1),
  phase: z.enum(["R0", "P1", "P2"]),
  scheduledAt: z.string().min(1),
  venue: z.string().min(1, "A venue is required.").max(120),
  durationMinutes: z.number().int().min(5).max(240).default(20),
  /** Set true to schedule despite a reported clash. */
  force: z.boolean().default(false),
});

/**
 * Schedule (or reschedule) a group's review for a phase.
 *
 * Clashes are reported rather than silently allowed: one guide cannot be in
 * two rooms and one room cannot hold two reviews. An admin can override with
 * `force`, which the UI surfaces explicitly.
 */
export async function POST(request: Request) {
  const auth = await requireApi(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  const parsed = ScheduleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid request.");
  }
  const { groupId, phase, venue, durationMinutes, force } = parsed.data;

  const scheduledAt = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    return badRequest("That date and time could not be read.");
  }

  const group = await prisma.group.findFirst({
    where: { id: groupId, cycleId: cycle.id },
    include: { allocation: { select: { facultyId: true, status: true } } },
  });
  if (!group) return badRequest("No such group in this cycle.");

  const facultyId =
    group.allocation?.status === "ALLOCATED" ? group.allocation.facultyId : null;

  const existing = await prisma.reviewSession.findMany({
    where: { cycleId: cycle.id, status: { not: "CANCELLED" } },
    include: { group: { select: { code: true } } },
  });

  const current = await prisma.reviewSession.findUnique({
    where: { groupId_phase: { groupId, phase } },
    select: { id: true },
  });

  const candidate: ScheduledSlot = {
    id: current?.id ?? "new",
    groupCode: group.code,
    facultyId,
    venue,
    startsAt: scheduledAt,
    durationMinutes,
  };

  const conflicts = findConflicts(
    candidate,
    existing.map((session) => ({
      id: session.id,
      groupCode: session.group.code,
      facultyId: session.facultyId,
      venue: session.venue,
      startsAt: session.scheduledAt,
      durationMinutes: session.durationMinutes,
    })),
  );

  if (conflicts.length > 0 && !force) {
    return NextResponse.json(
      {
        error: `Clash: ${conflicts.map((c) => c.detail).join("; ")}.`,
        conflicts,
      },
      { status: 409 },
    );
  }

  const session = await prisma.reviewSession.upsert({
    where: { groupId_phase: { groupId, phase } },
    create: {
      cycleId: cycle.id,
      groupId,
      facultyId,
      phase,
      scheduledAt,
      venue,
      durationMinutes,
      status: "SCHEDULED",
    },
    update: { facultyId, scheduledAt, venue, durationMinutes, status: "SCHEDULED" },
    select: { id: true, phase: true, scheduledAt: true, venue: true },
  });

  return NextResponse.json({
    ok: true,
    session,
    overriddenConflicts: force ? conflicts : [],
  });
}
