import type { Metadata } from "next";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { GroupPanel, NoGroupPanel } from "@/components/student/group-panel";
import { getSelectedCycle } from "@/lib/cycle";
import { requirePage } from "@/lib/rbac";
import { findMyGroup } from "@/server/services/groups";

export const metadata: Metadata = { title: "My Group" };

export default async function MyGroupPage() {
  const session = await requirePage(["STUDENT"]);
  const cycle = await getSelectedCycle();
  const studentId = session.studentId;

  if (!cycle || !studentId) {
    return (
      <>
        <PageHeader title="My Group" role="Student" />
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

  const group = await findMyGroup(studentId, cycle.id);

  return (
    <>
      <PageHeader
        title="My Group"
        subtitle="Members, average CGPA, domain and submission lock state."
        cycleName={cycle.name}
        role="Student"
      />

      {group ? (
        <GroupPanel
          currentStudentId={studentId}
          groupSize={cycle.groupSize}
          prefCount={cycle.prefCount}
          group={{
            id: group.id,
            code: group.code,
            status: group.status,
            avgCgpa: Number(group.avgCgpa),
            domain: group.domain?.name ?? null,
            lockedAt: group.lockedAt?.toISOString() ?? null,
            leaderId: group.leaderId,
            preferenceCount: group.preferences.length,
            titleRegistered: Boolean(group.title),
            statementWritten: Boolean(group.title?.problemStatement?.trim()),
            pendingInvites: group.invites.length,
            guide: group.allocation?.faculty?.fullName ?? null,
            members: group.members.map((member) => ({
              id: member.id,
              role: member.role,
              usn: member.student.usn,
              fullName: member.student.fullName,
              email: member.student.email,
              cgpa: Number(member.student.cgpa),
            })),
          }}
        />
      ) : (
        <NoGroupPanel groupSize={cycle.groupSize} />
      )}
    </>
  );
}
