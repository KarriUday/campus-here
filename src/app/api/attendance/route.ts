import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/rbac";
import { badRequest, notFound } from "@/server/http";

const AttendanceSchema = z.object({
  sessionId: z.string().min(1),
  entries: z
    .array(
      z.object({
        studentId: z.string().min(1),
        status: z.enum(["PRESENT", "ABSENT"]),
        remarks: z.string().max(300).optional(),
      }),
    )
    .min(1, "Mark at least one student."),
});

/** Attendance for one review session. */
export async function GET(request: Request) {
  const auth = await requireApi(["ADMIN", "FACULTY"]);
  if (!auth.ok) return auth.response;

  const sessionId = new URL(request.url).searchParams.get("sessionId");
  if (!sessionId) return badRequest("A sessionId is required.");

  const session = await prisma.reviewSession.findUnique({
    where: { id: sessionId },
    include: {
      group: {
        select: {
          code: true,
          members: {
            orderBy: { student: { usn: "asc" } },
            select: {
              student: { select: { id: true, usn: true, fullName: true } },
            },
          },
        },
      },
      attendance: true,
    },
  });
  if (!session) return notFound("No such review session.");

  // A guide may only read their own session.
  if (
    auth.session.role === "FACULTY" &&
    session.facultyId !== auth.session.facultyId
  ) {
    return NextResponse.json(
      { error: "That session belongs to another guide." },
      { status: 403 },
    );
  }

  const marked = new Map(session.attendance.map((row) => [row.studentId, row]));

  return NextResponse.json({
    session: {
      id: session.id,
      groupCode: session.group.code,
      phase: session.phase,
      scheduledAt: session.scheduledAt,
      venue: session.venue,
      status: session.status,
    },
    roster: session.group.members.map(({ student }) => ({
      studentId: student.id,
      usn: student.usn,
      fullName: student.fullName,
      status: marked.get(student.id)?.status ?? null,
      remarks: marked.get(student.id)?.remarks ?? null,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireApi(["ADMIN", "FACULTY"]);
  if (!auth.ok) return auth.response;

  const parsed = AttendanceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid request.");
  }

  const session = await prisma.reviewSession.findUnique({
    where: { id: parsed.data.sessionId },
    include: { group: { select: { members: { select: { studentId: true } } } } },
  });
  if (!session) return notFound("No such review session.");

  if (
    auth.session.role === "FACULTY" &&
    session.facultyId !== auth.session.facultyId
  ) {
    return NextResponse.json(
      { error: "You can only mark attendance for your own sessions." },
      { status: 403 },
    );
  }

  // Only members of the group being reviewed can be marked.
  const memberIds = new Set(session.group.members.map((m) => m.studentId));
  const stranger = parsed.data.entries.find((e) => !memberIds.has(e.studentId));
  if (stranger) {
    return badRequest("One of those students is not in this group.");
  }

  const saved = await prisma.$transaction(async (tx) => {
    for (const entry of parsed.data.entries) {
      await tx.attendance.upsert({
        where: {
          sessionId_studentId: {
            sessionId: session.id,
            studentId: entry.studentId,
          },
        },
        create: {
          sessionId: session.id,
          studentId: entry.studentId,
          status: entry.status,
          remarks: entry.remarks ?? null,
          markedById: auth.session.userId,
        },
        update: {
          status: entry.status,
          remarks: entry.remarks ?? null,
          markedById: auth.session.userId,
          markedAt: new Date(),
        },
      });
    }

    // Marking attendance is what completes a session.
    await tx.reviewSession.update({
      where: { id: session.id },
      data: { status: "COMPLETED" },
    });

    return tx.attendance.count({ where: { sessionId: session.id } });
  });

  return NextResponse.json({ ok: true, marked: saved });
}
