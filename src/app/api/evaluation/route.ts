import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/rbac";
import { badRequest, notFound } from "@/server/http";

const EvaluationSchema = z.object({
  sessionId: z.string().min(1),
  score: z
    .number()
    .min(0, "Score cannot be negative.")
    .max(10, "Score is out of 10."),
  remarks: z.string().max(1000).optional(),
});

export async function GET(request: Request) {
  const auth = await requireApi(["ADMIN", "FACULTY"]);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");

  const evaluations = await prisma.evaluation.findMany({
    where: {
      ...(sessionId ? { sessionId } : {}),
      ...(auth.session.role === "FACULTY"
        ? { facultyId: auth.session.facultyId ?? "__none__" }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      group: { select: { code: true } },
      session: { select: { phase: true, scheduledAt: true } },
      faculty: { select: { fullName: true } },
    },
  });

  return NextResponse.json({
    evaluations: evaluations.map((row) => ({
      id: row.id,
      sessionId: row.sessionId,
      groupCode: row.group.code,
      phase: row.session.phase,
      score: Number(row.score),
      remarks: row.remarks,
      guide: row.faculty.fullName,
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
  });
  if (!session) return notFound("No such review session.");

  if (
    auth.session.role === "FACULTY" &&
    session.facultyId !== auth.session.facultyId
  ) {
    return NextResponse.json(
      { error: "You can only evaluate your own sessions." },
      { status: 403 },
    );
  }

  const facultyId = session.facultyId ?? auth.session.facultyId;
  if (!facultyId) {
    return badRequest("This session has no guide assigned.");
  }

  const evaluation = await prisma.evaluation.upsert({
    where: {
      sessionId_groupId: { sessionId: session.id, groupId: session.groupId },
    },
    create: {
      sessionId: session.id,
      groupId: session.groupId,
      facultyId,
      score: parsed.data.score,
      remarks: parsed.data.remarks ?? null,
    },
    update: {
      score: parsed.data.score,
      remarks: parsed.data.remarks ?? null,
    },
    select: { id: true, score: true, remarks: true },
  });

  return NextResponse.json({
    ok: true,
    evaluation: { ...evaluation, score: Number(evaluation.score) },
  });
}
