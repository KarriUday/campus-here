import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, StatCard } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/rbac";
import { formatCgpa } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin Dashboard" };

const FLOW = [
  {
    step: "Step 1",
    title: "Admin uploads students + faculty",
    detail: "Validation catches wrong CGPA, duplicate USNs and missing emails.",
  },
  {
    step: "Step 2",
    title: "Students form groups of exactly four",
    detail: "Average CGPA is computed by the database and locked on submit.",
  },
  {
    step: "Step 3",
    title: "Allocation engine matches guides",
    detail: "Gale-Shapley over six preferences with a hard cap per guide.",
  },
  {
    step: "Step 4",
    title: "Reviews scheduled, reminders queued",
    detail: "R0 / P1 / P2 with 15-day and 7-day alerts at 09:00 IST.",
  },
];

export default async function AdminDashboardPage() {
  await requirePage(["ADMIN"]);
  const cycle = await getSelectedCycle();

  if (!cycle) {
    return (
      <>
        <PageHeader
          title="Admin Dashboard"
          subtitle="Cycle-wide overview with shortcuts for imports, allocation and scheduling."
          role="Admin"
        />
        <Card>
          <CardBody>
            <p className="text-ink-secondary text-sm">
              No project cycles exist yet. Seed the database or create a cycle
              in Settings.
            </p>
          </CardBody>
        </Card>
      </>
    );
  }

  const cycleId = cycle.id;
  const [
    studentCount,
    groupCount,
    submittedCount,
    allocatedCount,
    facultyCount,
    titleCount,
    recentAllocations,
  ] = await Promise.all([
    prisma.studentCycle.count({ where: { cycleId } }),
    prisma.group.count({ where: { cycleId } }),
    prisma.group.count({ where: { cycleId, prefsSubmittedAt: { not: null } } }),
    prisma.allocation.count({ where: { cycleId, status: "ALLOCATED" } }),
    prisma.faculty.count({ where: { isActive: true } }),
    prisma.projectTitle.count({ where: { cycleId } }),
    prisma.allocation.findMany({
      where: { cycleId },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        group: { select: { code: true, avgCgpa: true } },
        faculty: { select: { fullName: true } },
      },
    }),
  ]);

  // Groups that finished their preference list but hold no guide yet — the
  // queue the allocation screen exists to clear.
  const awaitingAllocation = submittedCount - allocatedCount;

  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Cycle-wide overview with shortcuts for imports, allocation and scheduling."
        cycleName={cycle.name}
        role="Admin"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Students"
          value={studentCount}
          meta="enrolled in this cycle"
          tone="info"
        />
        <StatCard
          label="Groups"
          value={groupCount}
          meta={`${submittedCount} submitted preferences`}
        />
        <StatCard
          label="Allocated"
          value={allocatedCount}
          meta={`across ${facultyCount} guides`}
          tone="success"
        />
        <StatCard
          label="Awaiting allocation"
          value={awaitingAllocation}
          meta={awaitingAllocation > 0 ? "run the matching engine" : "queue is clear"}
          tone={awaitingAllocation > 0 ? "warning" : "success"}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="End-to-end flow"
            subtitle="How a cycle moves from upload to final review."
          />
          <CardBody className="grid gap-3 sm:grid-cols-2">
            {FLOW.map((item) => (
              <div
                key={item.step}
                className="border-border-subtle bg-surface rounded-xl border p-4"
              >
                <p className="text-ink-tertiary text-[10px] font-semibold tracking-wider uppercase">
                  {item.step}
                </p>
                <p className="text-ink mt-1 text-sm font-medium">{item.title}</p>
                <p className="text-ink-secondary mt-1 text-xs leading-relaxed">
                  {item.detail}
                </p>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Registry"
            subtitle="Live counts for this cycle."
          />
          <CardBody className="space-y-3">
            {[
              { label: "Registered titles", value: titleCount, href: "/admin/titles" },
              { label: "Active guides", value: facultyCount, href: "/admin/faculty" },
              { label: "Groups", value: groupCount, href: "/admin/groups" },
            ].map((row) => (
              <Link
                key={row.label}
                href={row.href}
                className="border-border-subtle hover:bg-surface flex items-center justify-between rounded-xl border px-4 py-3 transition-colors"
              >
                <span className="text-ink-secondary text-sm">{row.label}</span>
                <span className="text-ink mono text-sm font-semibold">
                  {row.value}
                </span>
              </Link>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Most recent allocations"
          subtitle="Group to guide, with the preference rank that was satisfied."
        />
        <CardBody>
          <DataTable
            rows={recentAllocations}
            rowKey={(row) => row.id}
            emptyTitle="No allocations yet"
            emptyDescription="Run the allocation engine once groups have submitted their preferences."
            columns={[
              {
                key: "group",
                header: "Group",
                render: (row) => (
                  <span className="mono">{row.group.code}</span>
                ),
              },
              {
                key: "cgpa",
                header: "Avg CGPA",
                numeric: true,
                render: (row) => formatCgpa(Number(row.group.avgCgpa)),
              },
              {
                key: "guide",
                header: "Guide",
                render: (row) => row.faculty?.fullName ?? "—",
              },
              {
                key: "rank",
                header: "Pref",
                numeric: true,
                render: (row) => row.matchedRank ?? "—",
              },
              {
                key: "status",
                header: "Status",
                render: (row) =>
                  row.status === "ALLOCATED" ? (
                    <Badge tone="success">Allocated</Badge>
                  ) : (
                    <Badge tone="warning">Unallocated</Badge>
                  ),
              },
            ]}
          />
        </CardBody>
      </Card>
    </>
  );
}
