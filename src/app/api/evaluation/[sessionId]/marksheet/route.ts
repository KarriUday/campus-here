import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/rbac";
import { notFound } from "@/server/http";
import { PHASE_RUBRICS, getVerdictConfig } from "@/lib/evaluation-rubrics";

export async function GET(
  request: Request,
  props: { params: Promise<{ sessionId: string }> },
) {
  const auth = await requireApi(["ADMIN", "FACULTY", "STUDENT"]);
  if (!auth.ok) return auth.response;

  const { sessionId } = await props.params;

  const session = await prisma.reviewSession.findUnique({
    where: { id: sessionId },
    include: {
      cycle: { select: { id: true, name: true, code: true } },
      group: {
        include: {
          domain: { select: { name: true } },
          title: { select: { title: true, problemStatement: true } },
          members: {
            include: {
              student: {
                select: { id: true, usn: true, fullName: true, email: true, cgpa: true },
              },
            },
          },
        },
      },
      faculty: { select: { id: true, fullName: true, email: true, designation: true } },
      evaluations: {
        include: {
          studentScores: {
            include: {
              student: { select: { id: true, usn: true, fullName: true } },
            },
          },
        },
      },
      attendance: {
        include: {
          student: { select: { id: true, usn: true, fullName: true } },
        },
      },
    },
  });

  if (!session) return notFound("Review session not found.");

  const evaluation = session.evaluations[0] ?? null;
  const rubricDefinition = PHASE_RUBRICS[session.phase];
  const rubricScores = (evaluation?.rubricScores as Record<string, number>) ?? {};
  const verdictConfig = getVerdictConfig(evaluation?.verdict);

  const marksheetData = {
    institution: {
      name: "BMS Institute of Technology & Management",
      department: "Department of Computer Science & Engineering",
      location: "Yelahanka, Bengaluru — 560119",
      cycle: session.cycle.name,
      academicYear: session.cycle.code,
    },
    session: {
      phase: session.phase,
      phaseTitle: rubricDefinition.title,
      scheduledAt: session.scheduledAt,
      venue: session.venue,
      durationMinutes: session.durationMinutes,
      status: session.status,
    },
    group: {
      code: session.group.code,
      domain: session.group.domain?.name ?? "General CSE",
      projectTitle: session.group.title?.title ?? "Untitled Project",
      problemStatement: session.group.title?.problemStatement ?? null,
      members: session.group.members.map((m: any) => {
        const studentAttendance = session.attendance.find((a: any) => a.studentId === m.student.id);
        const studentScore = evaluation?.studentScores.find((s: any) => s.studentId === m.student.id);
        return {
          id: m.student.id,
          usn: m.student.usn,
          fullName: m.student.fullName,
          email: m.student.email,
          cgpa: Number(m.student.cgpa),
          attendanceStatus: studentAttendance?.status ?? "PRESENT",
          individualScore: studentScore ? Number(studentScore.score) : Number(evaluation?.score ?? 0),
          individualRemarks: studentScore?.remarks ?? null,
        };
      }),
    },
    guide: {
      fullName: session.faculty?.fullName ?? "Unassigned",
      designation: session.faculty?.designation ?? "Faculty Guide",
      email: session.faculty?.email ?? "",
    },
    evaluation: evaluation
      ? {
          totalScore: Number(evaluation.score),
          maxScore: 10.0,
          percentage: (Number(evaluation.score) / 10.0) * 100,
          verdict: evaluation.verdict,
          verdictLabel: verdictConfig.label,
          remarks: evaluation.remarks,
          actionItems: evaluation.actionItems,
          evaluatedAt: evaluation.updatedAt,
          rubricBreakdown: rubricDefinition.criteria.map((criterion) => ({
            id: criterion.id,
            name: criterion.name,
            maxScore: criterion.maxScore,
            awardedScore: rubricScores[criterion.id] ?? 0,
            description: criterion.description,
          })),
        }
      : null,
  };

  return NextResponse.json({ marksheet: marksheetData });
}
