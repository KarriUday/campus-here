import type { Metadata } from "next";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, StatCard } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/rbac";
import { formatCgpa } from "@/lib/utils";

export const metadata: Metadata = { title: "Groups" };

const STATUS_TONE: Record<string, BadgeTone> = {
  FORMING: "neutral",
  READY: "info",
  SUBMITTED: "warning",
  ALLOCATED: "success",
};

export default async function GroupsPage() {
  await requirePage(["ADMIN"]);
  const cycle = await getSelectedCycle();

  if (!cycle) {
    return (
      <>
        <PageHeader title="Groups" role="Admin" />
        <Card>
          <CardBody>
            <p className="text-ink-secondary text-sm">No cycle selected.</p>
          </CardBody>
        </Card>
      </>
    );
  }

  const [groups, byStatus] = await Promise.all([
    prisma.group.findMany({
      where: { cycleId: cycle.id },
      orderBy: [{ status: "asc" }, { code: "asc" }],
      take: 200,
      select: {
        id: true,
        code: true,
        status: true,
        avgCgpa: true,
        domain: { select: { name: true } },
        _count: { select: { members: true, preferences: true } },
        allocation: {
          select: {
            status: true,
            matchedRank: true,
            faculty: { select: { fullName: true } },
          },
        },
      },
    }),
    prisma.group.groupBy({
      by: ["status"],
      where: { cycleId: cycle.id },
      _count: { _all: true },
    }),
  ]);

  const countFor = (status: string) =>
    byStatus.find((row) => row.status === status)?._count._all ?? 0;

  return (
    <>
      <PageHeader
        title="Groups"
        subtitle={`Self-formed groups of exactly ${cycle.groupSize}. Average CGPA is computed by the database, never typed in.`}
        cycleName={cycle.name}
        role="Admin"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Forming" value={countFor("FORMING")} meta="incomplete" />
        <StatCard
          label="Ready"
          value={countFor("READY")}
          meta="full, no preferences yet"
          tone="info"
        />
        <StatCard
          label="Submitted"
          value={countFor("SUBMITTED")}
          meta="awaiting allocation"
          tone="warning"
        />
        <StatCard
          label="Allocated"
          value={countFor("ALLOCATED")}
          meta="guide assigned"
          tone="success"
        />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="All groups"
          subtitle="Membership, computed average CGPA, preference progress and guide."
        />
        <CardBody>
          <DataTable
            rows={groups}
            rowKey={(row) => row.id}
            emptyTitle="No groups formed yet"
            emptyDescription="Groups appear here once students start forming them."
            columns={[
              {
                key: "code",
                header: "Group",
                render: (row) => <span className="mono">{row.code}</span>,
              },
              {
                key: "members",
                header: "Members",
                numeric: true,
                render: (row) => `${row._count.members}/${cycle.groupSize}`,
              },
              {
                key: "cgpa",
                header: "Avg CGPA",
                numeric: true,
                render: (row) =>
                  Number(row.avgCgpa) > 0 ? formatCgpa(Number(row.avgCgpa)) : "—",
              },
              {
                key: "domain",
                header: "Domain",
                render: (row) => row.domain?.name ?? "—",
              },
              {
                key: "prefs",
                header: "Preferences",
                numeric: true,
                render: (row) =>
                  `${row._count.preferences}/${cycle.prefCount}`,
              },
              {
                key: "guide",
                header: "Guide",
                render: (row) => row.allocation?.faculty?.fullName ?? "—",
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
