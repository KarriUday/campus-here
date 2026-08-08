import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, StatCard } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/rbac";
import { formatCgpa } from "@/lib/utils";

export const metadata: Metadata = { title: "Assigned Groups" };

export default async function AssignedGroupsPage() {
  const session = await requirePage(["FACULTY"]);
  const cycle = await getSelectedCycle();
  const facultyId = session.facultyId;

  if (!cycle || !facultyId) {
    return (
      <>
        <PageHeader title="Assigned Groups" role="Faculty" />
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

  const [allocations, me] = await Promise.all([
    prisma.allocation.findMany({
      where: { cycleId: cycle.id, facultyId, status: "ALLOCATED" },
      include: {
        group: {
          include: {
            domain: { select: { name: true } },
            title: {
              select: { title: true, approvalStatus: true, similarityScore: true },
            },
            members: {
              orderBy: { student: { usn: "asc" } },
              include: {
                student: {
                  select: {
                    id: true,
                    usn: true,
                    fullName: true,
                    email: true,
                    phone: true,
                    cgpa: true,
                  },
                },
              },
            },
            sessions: { orderBy: { scheduledAt: "asc" } },
          },
        },
      },
    }),
    prisma.faculty.findUnique({
      where: { id: facultyId },
      select: { capacity: true },
    }),
  ]);

  const studentCount = allocations.reduce(
    (sum, row) => sum + row.group.members.length,
    0,
  );

  return (
    <>
      <PageHeader
        title="Assigned Groups"
        subtitle="Groups mapped to you by the allocation engine."
        cycleName={cycle.name}
        role="Faculty"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Groups"
          value={allocations.length}
          meta={`capacity ${me?.capacity ?? 2} this cycle`}
          tone="info"
        />
        <StatCard label="Students" value={studentCount} meta="under your guidance" />
        <StatCard
          label="Titles pending"
          value={
            allocations.filter((a) => a.group.title?.approvalStatus === "PENDING")
              .length
          }
          meta="awaiting your approval"
          tone="warning"
        />
      </div>

      <div className="mt-6 space-y-6">
        {allocations.length === 0 && (
          <Card>
            <CardBody>
              <p className="text-ink-secondary text-sm">
                No groups are allocated to you for this cycle yet.
              </p>
            </CardBody>
          </Card>
        )}

        {allocations.map(({ group, matchedRank, method }) => (
          <Card key={group.id}>
            <CardHeader
              title={group.code}
              subtitle={
                group.title?.title ?? "No title registered yet"
              }
              actions={
                <>
                  <Badge tone="neutral">
                    {group.domain?.name ?? "No domain"}
                  </Badge>
                  <Badge tone="neutral">
                    Avg CGPA {formatCgpa(Number(group.avgCgpa))}
                  </Badge>
                  <Badge tone={method === "MANUAL" ? "warning" : "success"}>
                    {method === "MANUAL"
                      ? "Assigned by admin"
                      : `Choice #${matchedRank ?? "—"}`}
                  </Badge>
                </>
              }
            />
            <CardBody className="space-y-4">
              <DataTable
                rows={group.members}
                rowKey={(row) => row.id}
                columns={[
                  {
                    key: "usn",
                    header: "USN",
                    render: (row) => (
                      <span className="mono">{row.student.usn}</span>
                    ),
                  },
                  {
                    key: "name",
                    header: "Name",
                    render: (row) => row.student.fullName,
                  },
                  {
                    key: "cgpa",
                    header: "CGPA",
                    numeric: true,
                    render: (row) => formatCgpa(Number(row.student.cgpa)),
                  },
                  {
                    key: "email",
                    header: "Email",
                    render: (row) => row.student.email,
                  },
                  {
                    key: "phone",
                    header: "Phone",
                    render: (row) => row.student.phone ?? "—",
                  },
                ]}
              />

              {group.sessions.length > 0 && (
                <p className="text-ink-secondary text-sm">
                  Reviews:{" "}
                  {group.sessions
                    .map(
                      (item) =>
                        `${item.phase} on ${item.scheduledAt.toLocaleDateString("en-IN")} (${item.venue})`,
                    )
                    .join(" · ")}
                </p>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  );
}
