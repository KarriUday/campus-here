import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, StatCard } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Faculty Dashboard" };

const DATE_FORMAT = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function FacultyDashboardPage() {
  const session = await requirePage(["FACULTY"]);
  const cycle = await getSelectedCycle();
  const facultyId = session.facultyId;

  if (!cycle || !facultyId) {
    return (
      <>
        <PageHeader
          title="Faculty Dashboard"
          subtitle="Assigned groups, upcoming sessions and quick marking actions."
          role="Faculty"
        />
        <Card>
          <CardBody>
            <p className="text-ink-secondary text-sm">
              This account is not linked to a faculty record for the selected
              cycle.
            </p>
          </CardBody>
        </Card>
      </>
    );
  }

  const cycleId = cycle.id;
  const [assignedCount, capacity, upcoming, completedCount] = await Promise.all([
    prisma.allocation.count({
      where: { cycleId, facultyId, status: "ALLOCATED" },
    }),
    prisma.faculty.findUnique({
      where: { id: facultyId },
      select: { capacity: true },
    }),
    prisma.reviewSession.findMany({
      where: { cycleId, facultyId, status: "SCHEDULED" },
      orderBy: { scheduledAt: "asc" },
      take: 8,
      include: { group: { select: { code: true } } },
    }),
    prisma.reviewSession.count({
      where: { cycleId, facultyId, status: "COMPLETED" },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Faculty Dashboard"
        subtitle="Assigned groups, upcoming sessions and quick marking actions."
        cycleName={cycle.name}
        role="Faculty"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Assigned groups"
          value={assignedCount}
          meta={`capacity ${capacity?.capacity ?? 2} this cycle`}
          tone={
            assignedCount >= (capacity?.capacity ?? 2) ? "warning" : "info"
          }
        />
        <StatCard
          label="Upcoming reviews"
          value={upcoming.length}
          meta="scheduled and not yet held"
          tone="success"
        />
        <StatCard
          label="Completed reviews"
          value={completedCount}
          meta="attendance and marks recorded"
        />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Upcoming review sessions"
          subtitle="Mark attendance and evaluate in one flow."
        />
        <CardBody>
          <DataTable
            rows={upcoming}
            rowKey={(row) => row.id}
            emptyTitle="No sessions scheduled"
            emptyDescription="Once the coordinator schedules R0 for your groups, they appear here."
            columns={[
              {
                key: "when",
                header: "When",
                render: (row) => DATE_FORMAT.format(row.scheduledAt),
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
              { key: "venue", header: "Venue", render: (row) => row.venue },
            ]}
          />
        </CardBody>
      </Card>
    </>
  );
}
