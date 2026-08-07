import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CsvImportPanel } from "@/components/admin/csv-import-panel";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Data Ingestion (Upload)" };

const DATE_FORMAT = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function ImportsPage() {
  await requirePage(["ADMIN"]);
  const cycle = await getSelectedCycle();

  const batches = cycle
    ? await prisma.importBatch.findMany({
        where: { cycleId: cycle.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { appliedBy: { select: { name: true } } },
      })
    : [];

  return (
    <>
      <PageHeader
        title="Data Ingestion (Upload)"
        subtitle="Upload student, faculty and previous-title data as CSV. Every row is validated on the server before anything is written."
        cycleName={cycle?.name}
        role="Admin"
      />

      <div className="space-y-6">
        <CsvImportPanel
          entity="students"
          title="Upload students (CSV)"
          subtitle="Required columns: usn, name (or full_name), cgpa, email. Optional: phone."
          hint="Export from Excel or Google Sheets as CSV. A student who already exists is enrolled into this cycle rather than duplicated."
        />

        <CsvImportPanel
          entity="faculty"
          title="Upload faculty (CSV)"
          subtitle="Required columns: name (or full_name), email, designation. Optional: domains, capacity, phone, employee_id."
          hint="Separate multiple domains with a semicolon, e.g. AI/ML;Data Science. Capacity defaults to 2 groups per guide."
        />

        <CsvImportPanel
          entity="titles"
          title="Upload previous project titles"
          subtitle="Seeds the originality corpus that duplicate detection scores against."
          hint="One title per line, or a CSV with title, group, domain, guide, cycle. The aliases project title, final title, group code, faculty and mentor are accepted."
          allowPaste
        />

        <Card>
          <CardHeader
            title="Recent imports"
            subtitle="Every applied import is recorded, including the rows it rejected."
          />
          <CardBody>
            <DataTable
              rows={batches}
              rowKey={(row) => row.id}
              emptyTitle="No imports applied yet"
              emptyDescription="Validated imports appear here once you apply them."
              columns={[
                {
                  key: "when",
                  header: "When",
                  render: (row) => DATE_FORMAT.format(row.createdAt),
                },
                {
                  key: "entity",
                  header: "Entity",
                  render: (row) => <Badge tone="info">{row.entity}</Badge>,
                },
                {
                  key: "total",
                  header: "Rows",
                  numeric: true,
                  render: (row) => row.totalRows,
                },
                {
                  key: "ok",
                  header: "Imported",
                  numeric: true,
                  render: (row) => row.successRows,
                },
                {
                  key: "failed",
                  header: "Rejected",
                  numeric: true,
                  render: (row) =>
                    row.failedRows > 0 ? (
                      <span className="text-error-ink">{row.failedRows}</span>
                    ) : (
                      0
                    ),
                },
                {
                  key: "by",
                  header: "By",
                  render: (row) => row.appliedBy.name,
                },
              ]}
            />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
