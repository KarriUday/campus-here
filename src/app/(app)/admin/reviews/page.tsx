import type { Metadata } from "next";
import { Card, CardBody, StatCard } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { SchedulePanel } from "@/components/admin/schedule-panel";
import { getSelectedCycle } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Reviews & Scheduling" };

/** Offered in the venue picker; free text is still accepted by the API. */
const VENUES = [
  "Seminar Hall 1",
  "Seminar Hall 2",
  "Lab 3",
  "Lab 5",
  "CSE Conference Room",
  "Project Lab A",
];

export default async function ReviewsPage() {
  await requirePage(["ADMIN"]);
  const cycle = await getSelectedCycle();

  if (!cycle) {
    return (
      <>
        <PageHeader title="Reviews & Scheduling" role="Admin" />
        <Card>
          <CardBody>
            <p className="text-ink-secondary text-sm">No cycle selected.</p>
          </CardBody>
        </Card>
      </>
    );
  }

  const [groups, sessions, unscheduled] = await Promise.all([
    prisma.group.findMany({
      where: { cycleId: cycle.id, status: "ALLOCATED" },
      orderBy: { code: "asc" },
      select: {
        id: true,
        code: true,
        domain: { select: { name: true } },
        allocation: { select: { faculty: { select: { fullName: true } } } },
      },
    }),
    prisma.reviewSession.findMany({
      where: { cycleId: cycle.id },
      orderBy: { scheduledAt: "asc" },
      include: {
        group: { select: { code: true } },
        faculty: { select: { fullName: true } },
        _count: { select: { attendance: true, evaluations: true } },
      },
    }),
    prisma.group.count({
      where: { cycleId: cycle.id, status: "ALLOCATED", sessions: { none: {} } },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Reviews & Scheduling"
        subtitle="Book R0, P1 and P2 with venue and time, with clash detection across guides and rooms."
        cycleName={cycle.name}
        role="Admin"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Allocated groups"
          value={groups.length}
          meta="eligible to be scheduled"
          tone="info"
        />
        <StatCard
          label="Sessions booked"
          value={sessions.length}
          meta="across all phases"
          tone="success"
        />
        <StatCard
          label="Never scheduled"
          value={unscheduled}
          meta="no session at all"
          tone={unscheduled > 0 ? "warning" : "success"}
        />
      </div>

      <div className="mt-6">
        <SchedulePanel
          venues={VENUES}
          groups={groups.map((group) => ({
            id: group.id,
            code: group.code,
            domain: group.domain?.name ?? null,
            guide: group.allocation?.faculty?.fullName ?? null,
          }))}
          sessions={sessions.map((session) => ({
            id: session.id,
            groupCode: session.group.code,
            phase: session.phase,
            scheduledAt: session.scheduledAt.toISOString(),
            venue: session.venue,
            durationMinutes: session.durationMinutes,
            status: session.status,
            guide: session.faculty?.fullName ?? null,
            attendanceMarked: session._count.attendance > 0,
            evaluated: session._count.evaluations > 0,
          }))}
        />
      </div>
    </>
  );
}
