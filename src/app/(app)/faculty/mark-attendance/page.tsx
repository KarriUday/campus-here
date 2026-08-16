import type { Metadata } from "next";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { AttendanceMarker } from "@/components/faculty/session-work";
import { ExportButton } from "@/components/reports/export-button";
import { getSelectedCycle } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Mark Attendance" };

export default async function MarkAttendancePage() {
  const session = await requirePage(["FACULTY"]);
  const cycle = await getSelectedCycle();
  const facultyId = session.facultyId;

  if (!cycle || !facultyId) {
    return (
      <>
        <PageHeader title="Mark Attendance" role="Faculty" />
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

  const sessions = await prisma.reviewSession.findMany({
    where: { cycleId: cycle.id, facultyId },
    orderBy: { scheduledAt: "asc" },
    include: {
      group: { select: { id: true, code: true, title: { select: { title: true } } } },
      _count: { select: { attendance: true, evaluations: true } },
    },
  });

  // Preload the first session's roster so the screen is useful immediately.
  const first = sessions[0];
  const roster = first
    ? await prisma.groupMember.findMany({
        where: { groupId: first.groupId },
        orderBy: { student: { usn: "asc" } },
        select: {
          student: { select: { id: true, usn: true, fullName: true } },
        },
      })
    : [];
  const marked = first
    ? await prisma.attendance.findMany({ where: { sessionId: first.id } })
    : [];
  const markedBy = new Map(marked.map((row) => [row.studentId, row.status]));

  return (
    <>
      <PageHeader
        title="Mark Attendance"
        subtitle="Batch-wise attendance marking, per review session."
        cycleName={cycle.name}
        role="Faculty"
        actions={
          <>
            <ExportButton type="attendance">Per session</ExportButton>
            <ExportButton type="attendance-cumulative">Cumulative</ExportButton>
          </>
        }
      />

      <AttendanceMarker
        initialSessionId={first?.id ?? null}
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
        }))}
        initialRoster={roster.map(({ student }) => ({
          studentId: student.id,
          usn: student.usn,
          fullName: student.fullName,
          status: markedBy.get(student.id) ?? null,
        }))}
      />
    </>
  );
}
