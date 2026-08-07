import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import {
  CapacitySettings,
  DomainSettings,
} from "@/components/admin/settings-panels";
import { getSelectedCycle } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requirePage(["ADMIN"]);
  const cycle = await getSelectedCycle();

  const [domains, capacityRules, cycles] = await Promise.all([
    prisma.domain.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { faculty: true, groups: true } } },
    }),
    prisma.capacityRule.findMany({ orderBy: { designation: "asc" } }),
    prisma.projectCycle.findMany({
      orderBy: [{ isActive: "desc" }, { code: "asc" }],
      include: {
        _count: { select: { enrollments: true, groups: true } },
      },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Domains, guide capacity defaults and cycle windows. These are the master data the allocation engine reads."
        cycleName={cycle?.name}
        role="Admin"
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <DomainSettings
          domains={domains.map((domain) => ({
            id: domain.id,
            name: domain.name,
            slug: domain.slug,
            description: domain.description,
            isActive: domain.isActive,
            facultyCount: domain._count.faculty,
            groupCount: domain._count.groups,
          }))}
        />
        <CapacitySettings rules={capacityRules} />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Project cycles"
          subtitle="Switch the active cycle from the selector in the navbar."
        />
        <CardBody>
          <DataTable
            rows={cycles}
            rowKey={(row) => row.id}
            emptyTitle="No cycles configured"
            columns={[
              { key: "name", header: "Cycle", render: (row) => row.name },
              {
                key: "code",
                header: "Code",
                render: (row) => <span className="mono">{row.code}</span>,
              },
              {
                key: "size",
                header: "Group size",
                numeric: true,
                render: (row) => row.groupSize,
              },
              {
                key: "prefs",
                header: "Preferences",
                numeric: true,
                render: (row) => row.prefCount,
              },
              {
                key: "students",
                header: "Students",
                numeric: true,
                render: (row) => row._count.enrollments,
              },
              {
                key: "groups",
                header: "Groups",
                numeric: true,
                render: (row) => row._count.groups,
              },
              {
                key: "active",
                header: "Status",
                render: (row) =>
                  row.isActive ? (
                    <Badge tone="success">Active</Badge>
                  ) : (
                    <Badge tone="neutral">Inactive</Badge>
                  ),
              },
            ]}
          />
        </CardBody>
      </Card>
    </>
  );
}
