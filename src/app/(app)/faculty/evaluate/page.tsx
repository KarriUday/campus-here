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
        group: { select: { code: true } },
        _count: { select: { attendance: true, evaluations: true } },
      },
    }),
    prisma.evaluation.findMany({
      where: { facultyId },
      orderBy: { updatedAt: "desc" },
      include: {
        group: { select: { code: true } },
        session: { select: { phase: true, scheduledAt: true } },
      },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Evaluate Groups"
        subtitle="Enter a score out of 10 with remarks. Saved per group per phase."
        cycleName={cycle.name}
        role="Faculty"
        actions={<ExportButton type="evaluation">Export scores</ExportButton>}
      />

      <EvaluationForm
        sessions={sessions.map((row) => ({
          id: row.id,
          groupCode: row.group.code,
          phase: row.phase,
          scheduledAt: row.scheduledAt.toISOString(),
          venue: row.venue,
          attendanceMarked: row._count.attendance > 0,
          evaluated: row._count.evaluations > 0,
        }))}
        existing={evaluations.map((row) => ({
          sessionId: row.sessionId,
          score: Number(row.score),
          remarks: row.remarks,
        }))}
      />

      <Card className="mt-6">
        <CardHeader
          title="Evaluations you have recorded"
          subtitle="Across every phase for your groups."
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
                render: (row) => <span className="mono">{row.group.code}</span>,
              },
              { key: "phase", header: "Phase", render: (row) => row.session.phase },
              {
                key: "score",
                header: "Score",
                numeric: true,
                render: (row) => `${formatCgpa(Number(row.score))} / 10`,
              },
              {
                key: "remarks",
                header: "Remarks",
                render: (row) => row.remarks ?? "—",
              },
              {
                key: "when",
                header: "Updated",
                render: (row) => DATE_ONLY.format(row.updatedAt),
              },
            ]}
          />
        </CardBody>
      </Card>
    </>
  );
}
