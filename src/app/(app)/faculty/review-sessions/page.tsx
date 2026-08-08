import type { Metadata } from "next";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, StatCard } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Review Sessions" };

/**
 * In the prototype this route called the dashboard's render function, which
 * re-set the page header and produced a screen byte-for-byte identical to the
 * Faculty Dashboard. It is a real screen here.
 */
const DATE_TIME = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

const STATUS_TONE: Record<string, BadgeTone> = {
  SCHEDULED: "success",
  COMPLETED: "info",
  CANCELLED: "error",
};

/**
 * Loading and splitting live in a plain async function rather than the
 * component body: reading the clock during render is impure, and this keeps
 * the boundary computed once per request.
 */
async function loadSessions(cycleId: string, facultyId: string) {
  const now = new Date();
  const sessions = await prisma.reviewSession.findMany({
    where: { cycleId, facultyId },
    orderBy: { scheduledAt: "asc" },
    include: {
      group: { select: { code: true, domain: { select: { name: true } } } },
      _count: { select: { attendance: true, evaluations: true } },
    },
  });

  return {
    sessions,
    upcoming: sessions.filter(
      (item) => item.scheduledAt >= now && item.status === "SCHEDULED",
    ).length,
    completed: sessions.filter((item) => item.status === "COMPLETED").length,
  };
}

export default async function ReviewSessionsPage() {
  const session = await requirePage(["FACULTY"]);
  const cycle = await getSelectedCycle();
  const facultyId = session.facultyId;

  if (!cycle || !facultyId) {
    return (
      <>
        <PageHeader title="Review Sessions" role="Faculty" />
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

  const { sessions, upcoming, completed } = await loadSessions(
    cycle.id,
    facultyId,
  );

  return (
    <>
      <PageHeader
        title="Review Sessions"
        subtitle="Every review scheduled for the groups you guide."
        cycleName={cycle.name}
        role="Faculty"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total sessions" value={sessions.length} meta="this cycle" />
        <StatCard
          label="Upcoming"
          value={upcoming}
          meta="still to be held"
          tone="success"
        />
        <StatCard
          label="Completed"
          value={completed}
          meta="attendance recorded"
          tone="info"
        />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Your schedule"
          subtitle="Mark attendance and evaluate from the screens in the sidebar."
        />
        <CardBody>
          <DataTable
            rows={sessions}
            rowKey={(row) => row.id}
            emptyTitle="Nothing scheduled"
            emptyDescription="The coordinator schedules reviews for allocated groups."
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
                key: "domain",
                header: "Domain",
                render: (row) => row.group.domain?.name ?? "—",
              },
              { key: "venue", header: "Venue", render: (row) => row.venue },
              {
                key: "attendance",
                header: "Attendance",
                render: (row) =>
                  row._count.attendance > 0 ? (
                    <Badge tone="success">{row._count.attendance} marked</Badge>
                  ) : (
                    <Badge tone="neutral">Not marked</Badge>
                  ),
              },
              {
                key: "evaluated",
                header: "Evaluation",
                render: (row) =>
                  row._count.evaluations > 0 ? (
                    <Badge tone="success">Recorded</Badge>
                  ) : (
                    <Badge tone="neutral">Pending</Badge>
                  ),
              },
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <Badge tone={STATUS_TONE[row.status] ?? "neutral"}>
                    {row.status}
                  </Badge>
                ),
              },
            ]}
          />
        </CardBody>
      </Card>
    </>
  );
}
