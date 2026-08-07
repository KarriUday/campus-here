import type { Metadata } from "next";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { NoGroupPanel } from "@/components/student/group-panel";
import {
  IncomingInvites,
  InviteSearch,
} from "@/components/student/invites-panel";
import { getSelectedCycle } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/rbac";
import { findMyGroup } from "@/server/services/groups";
import { formatCgpa } from "@/lib/utils";

export const metadata: Metadata = { title: "Invites" };

export default async function InvitesPage() {
  const session = await requirePage(["STUDENT"]);
  const cycle = await getSelectedCycle();
  const studentId = session.studentId;

  if (!cycle || !studentId) {
    return (
      <>
        <PageHeader title="Invites" role="Student" />
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

  const [group, invites] = await Promise.all([
    findMyGroup(studentId, cycle.id),
    prisma.groupInvite.findMany({
      where: { toStudentId: studentId, cycleId: cycle.id },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        fromStudent: { select: { fullName: true, usn: true } },
        group: {
          select: {
            code: true,
            avgCgpa: true,
            domain: { select: { name: true } },
            _count: { select: { members: true } },
          },
        },
      },
    }),
  ]);

  // Members plus outstanding invites cannot exceed the group size, which is
  // what stops a burst of acceptances overfilling a group.
  const seatsLeft = group
    ? cycle.groupSize - group.members.length - group.invites.length
    : 0;

  return (
    <>
      <PageHeader
        title="Invites"
        subtitle="Send requests to other students and manage the ones you receive."
        cycleName={cycle.name}
        role="Student"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {group ? (
          <InviteSearch groupId={group.id} seatsLeft={seatsLeft} />
        ) : (
          <NoGroupPanel groupSize={cycle.groupSize} />
        )}

        <IncomingInvites
          invites={invites.map((invite) => ({
            id: invite.id,
            status: invite.status,
            expiresAt: invite.expiresAt.toISOString(),
            from: invite.fromStudent,
            group: {
              code: invite.group.code,
              members: invite.group._count.members,
              avgCgpa: formatCgpa(Number(invite.group.avgCgpa)),
              domain: invite.group.domain?.name ?? null,
            },
          }))}
        />
      </div>

      {group && group.invites.length > 0 && (
        <Card className="mt-6">
          <CardBody>
            <p className="text-ink text-sm font-medium">
              Invites your group has sent
            </p>
            <ul className="mt-3 space-y-2">
              {group.invites.map((invite) => (
                <li
                  key={invite.id}
                  className="border-border-subtle flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm"
                >
                  <span className="text-ink">
                    {invite.toStudent.fullName}{" "}
                    <span className="text-ink-secondary mono">
                      {invite.toStudent.usn}
                    </span>
                  </span>
                  <span className="text-ink-secondary text-xs">
                    awaiting response
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </>
  );
}
