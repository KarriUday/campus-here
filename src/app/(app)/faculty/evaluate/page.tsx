import type { Metadata } from "next";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { EvaluationForm } from "@/components/faculty/session-work";
import { ExportButton } from "@/components/reports/export-button";
import { getSelectedCycle } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/rbac";
import { formatCgpa } from "@/lib/utils";
import { getVerdictConfig } from "@/lib/evaluation-rubrics";

export const metadata: Metadata = { title: "Evaluate Groups" };

const DATE_ONLY = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });

export default async function EvaluatePage() {
  const session = await requirePage(["FACULTY"]);
  const cycle = await getSelectedCycle();
  const facultyId = session.facultyId;

  if (!cycle || !facultyId) {
    return (
      <>
        <PageHeader title="Evaluate Groups" role="Faculty" />
        <Card>
          <CardBody>
            <p className="text-ink-secondary text-sm">
              This account is not linked to a faculty record.
            </p>
          </CardBody>
        </Card>
      </>
    );
  }

  const [sessions, evaluations] = await Promise.all([
    prisma.reviewSession.findMany({
      where: { cycleId: cycle.id, facultyId },
      orderBy: { scheduledAt: "asc" },
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
        _count: { select: { attendance: true, evaluations: true } },
      },
    }),
    prisma.evaluation.findMany({
      where: { facultyId },
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
        session: { select: { id: true, phase: true, scheduledAt: true, venue: true } },
        studentScores: {
          include: {
            student: { select: { id: true, usn: true, fullName: true } },
          },
        },
      },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Evaluate Groups"
        subtitle="Grade review sessions using standardized academic rubrics (R0, P1, P2), assign action items, and record individual student contribution marks."
        cycleName={cycle.name}
        role="Faculty"
        actions={<ExportButton type="evaluation">Export scores</ExportButton>}
      />

      <EvaluationForm
        sessions={sessions.map((row) => ({
          id: row.id,
          groupId: row.group.id,
          groupCode: row.group.code,
          projectTitle: row.group.title?.title ?? "Untitled Project",
          phase: row.phase,
          scheduledAt: row.scheduledAt.toISOString(),
          venue: row.venue,
          attendanceMarked: row._count.attendance > 0,
          evaluated: row._count.evaluations > 0,
          members: row.group.members.map((m) => ({
            id: m.student.id,
            usn: m.student.usn,
            fullName: m.student.fullName,
            email: m.student.email,
          })),
        }))}
        existing={evaluations.map((row) => ({
          sessionId: row.sessionId,
          score: Number(row.score),
          remarks: row.remarks,
          rubricScores: (row.rubricScores as Record<string, number>) ?? {},
          verdict: row.verdict,
          actionItems: row.actionItems,
          studentScores: row.studentScores.map((s) => ({
            studentId: s.studentId,
            score: Number(s.score),
            remarks: s.remarks,
          })),
        }))}
      />

      <Card className="mt-6">
        <CardHeader
          title="Evaluations you have recorded"
          subtitle="Across every phase for your assigned project groups."
        />
        <CardBody>
          <DataTable
            rows={evaluations}
            rowKey={(row) => row.id}
            emptyTitle="Nothing recorded yet"
            emptyDescription="Scores you save appear here."
            columns={[
              {
                key: "group",
                header: "Group",
                render: (row) => (
                  <div>
                    <span className="mono font-semibold text-[#28265f]">{row.group.code}</span>
                    <span className="block text-xs text-[#717182] truncate max-w-[200px]">
                      {row.group.title?.title ?? "Untitled Project"}
                    </span>
                  </div>
                ),
              },
              {
                key: "phase",
                header: "Phase",
                render: (row) => (
                  <span className="rounded bg-[#f0f0f5] px-2 py-0.5 text-xs font-bold text-[#28265f]">
                    {row.session.phase}
                  </span>
                ),
              },
              {
                key: "verdict",
                header: "Outcome",
                render: (row) => {
                  const cfg = getVerdictConfig(row.verdict);
                  return (
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${cfg.bg}`}
                    >
                      {cfg.label}
                    </span>
                  );
                },
              },
              {
                key: "score",
                header: "Score",
                numeric: true,
                render: (row) => (
                  <span className="font-bold text-[#1f2937]">
                    {formatCgpa(Number(row.score))} <span className="text-xs text-[#888]">/ 10</span>
                  </span>
                ),
              },
              {
                key: "remarks",
                header: "Remarks & Action Items",
                render: (row) => (
                  <div className="max-w-xs text-xs">
                    <p className="text-[#333] line-clamp-1">{row.remarks ?? "—"}</p>
                    {row.actionItems && (
                      <p className="text-[#b9272f] line-clamp-1 text-[0.7rem] font-medium">
                        Tasks: {row.actionItems}
                      </p>
                    )}
                  </div>
                ),
              },
              {
                key: "when",
                header: "Evaluated",
                render: (row) => DATE_ONLY.format(row.updatedAt),
              },
            ]}
          />
        </CardBody>
      </Card>
    </>
  );
}
