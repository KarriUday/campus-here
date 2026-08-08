import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, StatCard } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { ExportButton } from "@/components/reports/export-button";
import { getSelectedCycle } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/rbac";
import { formatCgpa } from "@/lib/utils";

export const metadata: Metadata = { title: "Attendance & Evaluation" };

const DATE_TIME = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AttendancePage() {
  await requirePage(["ADMIN"]);
  const cycle = await getSelectedCycle();

  if (!cycle) {
    return (
      <>
        <PageHeader title="Attendance & Evaluation" role="Admin" />
        <Card>
          <CardBody>
            <p className="text-ink-secondary text-sm">No cycle selected.</p>
          </CardBody>
        </Card>
      </>
    );
  }

  const [sessions, presentCount, absentCount, evaluations] = await Promise.all([
    prisma.reviewSession.findMany({
      where: { cycleId: cycle.id },
      orderBy: { scheduledAt: "desc" },
      take: 100,
      include: {
        group: { select: { code: true } },
        faculty: { select: { fullName: true } },
        attendance: { select: { status: true } },
        evaluations: { select: { score: true, remarks: true } },
      },
    }),
    prisma.attendance.count({
      where: { session: { cycleId: cycle.id }, status: "PRESENT" },
    }),
    prisma.attendance.count({
      where: { session: { cycleId: cycle.id }, status: "ABSENT" },
    }),
    prisma.evaluation.aggregate({
      where: { session: { cycleId: cycle.id } },
      _avg: { score: true },
      _count: { _all: true },
    }),
  ]);

  const totalMarks = presentCount + absentCount;

  return (
    <>
      <PageHeader
        title="Attendance & Evaluation"
        subtitle="Read-only view of what guides recorded, with cycle-wide exports."
        cycleName={cycle.name}
        role="Admin"
        actions={
          <>
            <ExportButton type="attendance">Attendance</ExportButton>
            <ExportButton type="attendance-cumulative">Cumulative</ExportButton>
            <ExportButton type="evaluation">Evaluations</ExportButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Attendance marked"
          value={totalMarks}
          meta={`${sessions.filter((s) => s.attendance.length > 0).length} session(s)`}
          tone="info"
        />
        <StatCard
          label="Present"
          value={
            totalMarks === 0 ? "—" : `${Math.round((presentCount / totalMarks) * 100)}%`
          }
          meta={`${presentCount} of ${totalMarks}`}
          tone="success"
        />
        <StatCard
          label="Absent"
          value={absentCount}
          meta="across all sessions"
          tone={absentCount > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="Average score"
          value={
            evaluations._avg.score === null
              ? "—"
              : formatCgpa(Number(evaluations._avg.score))
          }
          meta={`${evaluations._count._all} evaluation(s)`}
        />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Review sessions"
          subtitle="Guides record attendance and marks; this view is read-only."
        />
        <CardBody>
          <DataTable
            rows={sessions}
            rowKey={(row) => row.id}
            emptyTitle="No sessions yet"
            emptyDescription="Schedule reviews from Reviews & Scheduling."
            columns={[
              {
                key: "when",
                header: "When",
                render: (row) => DATE_TIME.format(row.scheduledAt),
              },
              {
                key: "phase",
                header: "Phase",
                render: (row) => <Badge tone="info">{row.phase}</Badge>,
              },
              {
                key: "group",
                header: "Group",
                render: (row) => <span className="mono">{row.group.code}</span>,
              },
              {
                key: "guide",
                header: "Guide",
                render: (row) => row.faculty?.fullName ?? "—",
              },
              {
                key: "present",
                header: "Present",
                numeric: true,
                render: (row) =>
                  row.attendance.length === 0
                    ? "—"
                    : `${row.attendance.filter((a) => a.status === "PRESENT").length}/${row.attendance.length}`,
              },
              {
                key: "score",
                header: "Score",
                numeric: true,
                render: (row) =>
                  row.evaluations[0]
                    ? `${formatCgpa(Number(row.evaluations[0].score))} / 10`
                    : "—",
              },
              {
                key: "remarks",
                header: "Remarks",
                render: (row) => row.evaluations[0]?.remarks ?? "—",
              },
            ]}
          />
        </CardBody>
      </Card>
    </>
  );
}
