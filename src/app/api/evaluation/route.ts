import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/rbac";
import { badRequest, notFound } from "@/server/http";
import { calculateRubricTotal } from "@/lib/evaluation-rubrics";

const StudentScoreInput = z.object({
  studentId: z.string().min(1),
  score: z.number().min(0).max(10),
  remarks: z.string().max(500).optional(),
});

const EvaluationSchema = z.object({
  sessionId: z.string().min(1),
  score: z
    .number()
    .min(0, "Score cannot be negative.")
    .max(10, "Score is out of 10.")
    .optional(),
  remarks: z.string().max(2000).optional(),
  rubricScores: z.record(z.string(), z.number()).optional(),
  verdict: z.enum(["APPROVED", "NEEDS_REVISION", "EXCELLENT", "REJECTED"]).default("APPROVED"),
  actionItems: z.string().max(2000).optional(),
  studentScores: z.array(StudentScoreInput).optional(),
});

export async function GET(request: Request) {
  const auth = await requireApi(["ADMIN", "FACULTY", "STUDENT"]);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");
  const groupId = url.searchParams.get("groupId");

  // Role-based scoping:
  // - Faculty sees their own assigned evaluations
  // - Students see only their own group's evaluations
  // - Admin sees everything
  let roleScope = {};
  if (auth.session.role === "FACULTY") {
    roleScope = { facultyId: auth.session.facultyId ?? "__none__" };
  } else if (auth.session.role === "STUDENT") {
    const studentGroup = await prisma.groupMember.findFirst({
      where: { studentId: auth.session.studentId ?? "__none__" },
      select: { groupId: true },
    });
    roleScope = { groupId: studentGroup?.groupId ?? "__none__" };
  }

  const evaluations = await prisma.evaluation.findMany({
    where: {
      ...(sessionId ? { sessionId } : {}),
      ...(groupId ? { groupId } : {}),
      ...roleScope,
    },
    orderBy: { updatedAt: "desc" },
    include: {
      group: {
        select: {
          id: true,
          code: true,
          title: { select: { title: true } },
          members: {
            select: {
              student: {
                select: { id: true, usn: true, fullName: true, email: true },
              },
            },
          },
        },
      },
      session: {
        select: {
          id: true,
          phase: true,
          scheduledAt: true,
          venue: true,
          durationMinutes: true,
        },
      },
      faculty: { select: { id: true, fullName: true, email: true } },
      studentScores: {
        include: {
          student: { select: { id: true, usn: true, fullName: true } },
        },
      },
    },
  });

  return NextResponse.json({
    evaluations: evaluations.map((row) => ({
      id: row.id,
      sessionId: row.sessionId,
      groupId: row.groupId,
      groupCode: row.group.code,
      projectTitle: row.group.title?.title ?? "Untitled Project",
      phase: row.session.phase,
      scheduledAt: row.session.scheduledAt,
      venue: row.session.venue,
      score: Number(row.score),
      remarks: row.remarks,
      rubricScores: row.rubricScores ?? null,
      verdict: row.verdict,
      actionItems: row.actionItems,
      guide: row.faculty.fullName,
      guideEmail: row.faculty.email,
      studentScores: row.studentScores.map((s) => ({
        studentId: s.studentId,
        usn: s.student.usn,
        fullName: s.student.fullName,
        score: Number(s.score),
        remarks: s.remarks,
      })),
      groupMembers: row.group.members.map((m) => ({
        id: m.student.id,
        usn: m.student.usn,
        fullName: m.student.fullName,
        email: m.student.email,
      })),
      updatedAt: row.updatedAt,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireApi(["ADMIN", "FACULTY"]);
  if (!auth.ok) return auth.response;

  const parsed = EvaluationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid request.");
  }

  const session = await prisma.reviewSession.findUnique({
    where: { id: parsed.data.sessionId },
    include: {
      group: {
        include: {
          members: {
            select: {
              studentId: true,
              student: { select: { email: true, usn: true } },
            },
          },
          title: { select: { title: true } },
        },
      },
    },
  });
  if (!session) return notFound("No such review session.");

  if (
    auth.session.role === "FACULTY" &&
    session.facultyId !== auth.session.facultyId
  ) {
    return NextResponse.json(
      { error: "You can only evaluate your own assigned review sessions." },
      { status: 403 },
    );
  }

  const facultyId = session.facultyId ?? auth.session.facultyId;
  if (!facultyId) {
    return badRequest("This session has no guide assigned.");
  }

  // Calculate final score: prefer rubric total if provided, otherwise fallback to explicit score
  let finalScore = parsed.data.score ?? 0;
  if (parsed.data.rubricScores) {
    finalScore = calculateRubricTotal(session.phase, parsed.data.rubricScores);
  }

  // Execute in an atomic transaction to update group evaluation and individual student scores
  const result = await prisma.$transaction(async (tx) => {
    const evaluation = await tx.evaluation.upsert({
      where: {
        sessionId_groupId: { sessionId: session.id, groupId: session.groupId },
      },
      create: {
        sessionId: session.id,
        groupId: session.groupId,
        facultyId,
        score: finalScore,
        remarks: parsed.data.remarks ?? null,
        rubricScores: parsed.data.rubricScores ?? undefined,
        verdict: parsed.data.verdict,
        actionItems: parsed.data.actionItems ?? null,
      },
      update: {
        score: finalScore,
        remarks: parsed.data.remarks ?? null,
        rubricScores: parsed.data.rubricScores ?? undefined,
        verdict: parsed.data.verdict,
        actionItems: parsed.data.actionItems ?? null,
      },
    });

    // Save individual student scores if supplied
    if (parsed.data.studentScores && parsed.data.studentScores.length > 0) {
      for (const st of parsed.data.studentScores) {
        await tx.studentScore.upsert({
          where: {
            evaluationId_studentId: {
              evaluationId: evaluation.id,
              studentId: st.studentId,
            },
          },
          create: {
            evaluationId: evaluation.id,
            studentId: st.studentId,
            score: st.score,
            remarks: st.remarks ?? null,
          },
          update: {
            score: st.score,
            remarks: st.remarks ?? null,
          },
        });
      }
    }

    // Send in-app notification to all members of the group
    for (const member of session.group.members) {
      await tx.notification.create({
        data: {
          cycleId: session.cycleId,
          studentId: member.studentId,
          toEmail: member.student.email,
          usn: member.student.usn,
          senderName: auth.session.email ?? "Faculty Guide",
          subject: `${session.phase} Review Evaluated (${finalScore}/10)`,
          body: `Your project guide recorded evaluation marks for ${session.phase}. Verdict: ${parsed.data.verdict}. Check your timeline for details.`,
          status: "DELIVERED",
        },
      });
    }

    return evaluation;
  });

  return NextResponse.json({
    ok: true,
    evaluation: {
      ...result,
      score: Number(result.score),
    },
  });
}
