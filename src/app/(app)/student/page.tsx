import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, StatCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/rbac";
import { formatCgpa } from "@/lib/utils";

export const metadata: Metadata = { title: "Student Dashboard" };

const DATE_FORMAT = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});
const DAY_FORMAT = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });

export default async function StudentDashboardPage() {
  const session = await requirePage(["STUDENT"]);
  const cycle = await getSelectedCycle();
  const studentId = session.studentId;

  if (!cycle || !studentId) {
    return (
      <>
        <PageHeader
          title="Student Dashboard"
          subtitle="See your group status, upcoming reviews and actions."
          role="Student"
        />
        <Card>
          <CardBody>
            <p className="text-ink-secondary text-sm">
              This account is not linked to a student record.
            </p>
          </CardBody>
        </Card>
      </>
    );
  }

  const cycleId = cycle.id;
  const [membership, pendingInvites, orientations, reminders] =
    await Promise.all([
      prisma.groupMember.findFirst({
        where: { studentId, cycleId },
        include: {
          group: {
            include: {
              domain: { select: { name: true } },
              members: { select: { id: true } },
              allocation: { include: { faculty: { select: { fullName: true } } } },
              sessions: {
                where: { status: "SCHEDULED" },
                orderBy: { scheduledAt: "asc" },
                take: 1,
              },
            },
          },
        },
      }),
      prisma.groupInvite.count({
        where: { toStudentId: studentId, cycleId, status: "PENDING" },
      }),
      prisma.orientation.findMany({
        where: { cycleId },
        orderBy: { createdAt: "desc" },
        take: 2,
      }),
      prisma.reminder.findMany({
        where: { cycleId, status: { in: ["DUE", "QUEUED"] } },
        orderBy: { dueAt: "asc" },
        take: 3,
      }),
    ]);

  const group = membership?.group ?? null;
  const nextSession = group?.sessions[0] ?? null;

  return (
    <>
      <PageHeader
        title="Student Dashboard"
        subtitle="See your group status, upcoming reviews and actions."
        cycleName={cycle.name}
        role="Student"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="My group"
          value={group ? `${group.members.length}/${cycle.groupSize}` : "—"}
          meta={group ? group.code : "not in a group yet"}
          tone={group ? "info" : "warning"}
        />
        <StatCard
          label="Average CGPA"
          value={group ? formatCgpa(Number(group.avgCgpa)) : "—"}
          meta={group ? "computed from members" : "join a group first"}
        />
        <StatCard
          label="Pending invites"
          value={pendingInvites}
          meta={pendingInvites > 0 ? "waiting on your response" : "nothing to action"}
          tone={pendingInvites > 0 ? "warning" : "success"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Group status"
            subtitle="Where you are in the cycle."
          />
          <CardBody>
            {group ? (
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-ink-secondary">Group</dt>
                  <dd className="text-ink mono font-medium">{group.code}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-secondary">Status</dt>
                  <dd>
                    <Badge
                      tone={group.status === "ALLOCATED" ? "success" : "neutral"}
                    >
                      {group.status}
                    </Badge>
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-secondary">Domain</dt>
                  <dd className="text-ink">{group.domain?.name ?? "Not chosen"}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-secondary">Guide</dt>
                  <dd className="text-ink">
                    {group.allocation?.faculty?.fullName ?? "Not allocated"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-secondary">Next review</dt>
                  <dd className="text-ink">
                    {nextSession
                      ? `${nextSession.phase} · ${DATE_FORMAT.format(nextSession.scheduledAt)}`
                      : "Not scheduled"}
                  </dd>
                </div>
              </dl>
            ) : (
              <EmptyState
                title="You are not in a group yet"
                description={`Groups need exactly ${cycle.groupSize} members before they can submit.`}
                action={
                  <Link
                    href="/student/invites"
                    className="text-primary rounded text-sm font-medium"
                  >
                    Find teammates
                  </Link>
                }
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Review reminders"
            subtitle="Generated from the academic calendar."
            actions={
              <Link
                href="/student/reminders"
                className="text-primary rounded text-sm font-medium"
              >
                View all
              </Link>
            }
          />
          <CardBody className="space-y-3">
            {reminders.length === 0 ? (
              <EmptyState
                title="No reminders yet"
                description="They appear once the coordinator uploads the academic calendar."
              />
            ) : (
              reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="border-border-subtle border p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-ink text-sm font-medium">
                      {reminder.title}
                    </p>
                    <Badge
                      tone={reminder.status === "DUE" ? "warning" : "neutral"}
                    >
                      {reminder.status}
                    </Badge>
                  </div>
                  <p className="text-ink-secondary mt-1 text-xs">
                    Reminder {DAY_FORMAT.format(reminder.dueAt)} · event{" "}
                    {DAY_FORMAT.format(reminder.eventDate)}
                  </p>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Orientation from your department"
          subtitle="Latest guidance for this cycle."
        />
        <CardBody className="space-y-3">
          {orientations.length === 0 ? (
            <EmptyState title="No orientation posted yet" />
          ) : (
            orientations.map((orientation) => (
              <div
                key={orientation.id}
                className="border-border-subtle border p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-ink text-sm font-medium">
                      {orientation.title}
                    </p>
                    <p className="text-ink-secondary text-xs">
                      {orientation.summary}
                    </p>
                  </div>
                  <Badge tone="neutral">{orientation.type}</Badge>
                </div>
                {orientation.text && (
                  <p className="text-ink-secondary mt-3 border-primary border-l-2 pl-4 py-1 text-sm leading-relaxed">
                    {orientation.text}
                  </p>
                )}
                <p className="text-ink-tertiary mt-2 text-xs">
                  Posted {DAY_FORMAT.format(orientation.createdAt)} by{" "}
                  {orientation.postedByLabel}
                </p>
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </>
  );
}
