import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, StatCard } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Faculty" };

const DESIGNATION_LABEL: Record<string, string> = {
  ASSISTANT_PROFESSOR: "Assistant Professor",
  ASSOCIATE_PROFESSOR: "Associate Professor",
  PROFESSOR: "Professor",
};

export default async function FacultyPage() {
  await requirePage(["ADMIN"]);
  const cycle = await getSelectedCycle();

  if (!cycle) {
    return (
      <>
        <PageHeader title="Faculty" role="Admin" />
        <Card>
          <CardBody>
            <p className="text-ink-secondary text-sm">No cycle selected.</p>
          </CardBody>
        </Card>
      </>
    );
  }

  const faculty = await prisma.faculty.findMany({
    orderBy: [{ isActive: "desc" }, { fullName: "asc" }],
    select: {
      id: true,
      fullName: true,
      email: true,
      designation: true,
      capacity: true,
      isActive: true,
      domains: { select: { id: true, name: true } },
      // Load is counted per cycle, so a guide who is full in Major still shows
      // as available in Mini.
      _count: {
        select: {
          allocations: { where: { cycleId: cycle.id, status: "ALLOCATED" } },
        },
      },
    },
  });

  const totalCapacity = faculty
    .filter((f) => f.isActive)
    .reduce((sum, f) => sum + f.capacity, 0);
  const totalAssigned = faculty.reduce(
    (sum, f) => sum + f._count.allocations,
    0,
  );
  const fullCount = faculty.filter(
    (f) => f.isActive && f._count.allocations >= f.capacity,
  ).length;

  return (
    <>
      <PageHeader
        title="Faculty"
        subtitle="Guide capacity and domain mapping. Load is counted per cycle from real allocations."
        cycleName={cycle.name}
        role="Admin"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Active guides"
          value={faculty.filter((f) => f.isActive).length}
          meta={`${faculty.length} on record`}
          tone="info"
        />
        <StatCard
          label="Capacity used"
          value={`${totalAssigned}/${totalCapacity}`}
          meta="groups against available slots"
          tone={totalAssigned >= totalCapacity ? "warning" : "success"}
        />
        <StatCard
          label="At capacity"
          value={fullCount}
          meta="guides who cannot take more"
          tone={fullCount > 0 ? "warning" : "neutral"}
        />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Faculty directory"
          subtitle="Upload or update the list from Data Ingestion."
        />
        <CardBody>
          <DataTable
            rows={faculty}
            rowKey={(row) => row.id}
            emptyTitle="No faculty on record"
            emptyDescription="Upload a faculty CSV from Data Ingestion."
            columns={[
              { key: "name", header: "Name", render: (row) => row.fullName },
              {
                key: "designation",
                header: "Designation",
                render: (row) =>
                  DESIGNATION_LABEL[row.designation] ?? row.designation,
              },
              {
                key: "domains",
                header: "Domains",
                render: (row) =>
                  row.domains.length === 0 ? (
                    "—"
                  ) : (
                    <span className="flex flex-wrap gap-1">
                      {row.domains.map((domain) => (
                        <Badge key={domain.id} tone="neutral">
                          {domain.name}
                        </Badge>
                      ))}
                    </span>
                  ),
              },
              {
                key: "capacity",
                header: "Capacity",
                numeric: true,
                render: (row) => row.capacity,
              },
              {
                key: "assigned",
                header: "Assigned",
                numeric: true,
                render: (row) => row._count.allocations,
              },
              {
                key: "load",
                header: "Load",
                render: (row) => {
                  if (!row.isActive) return <Badge tone="neutral">Inactive</Badge>;
                  const assigned = row._count.allocations;
                  if (assigned >= row.capacity)
                    return <Badge tone="warning">Full</Badge>;
                  return (
                    <Badge tone="success">
                      {row.capacity - assigned} free
                    </Badge>
                  );
                },
              },
            ]}
          />
        </CardBody>
      </Card>
    </>
  );
}
