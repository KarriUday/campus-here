import type { Metadata } from "next";
import { Card, CardBody, CardHeader, StatCard } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ExportButton } from "@/components/reports/export-button";
import { getSelectedCycle } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Reports & Exports" };

const REPORTS: Array<{
  type: string;
  title: string;
  detail: string;
}> = [
  {
    type: "students",
    title: "Student list",
    detail:
      "Every enrolled student with USN, contact details, CGPA, group, title, domain and guide.",
  },
  {
    type: "groups",
    title: "Group list",
    detail:
      "Membership, computed average CGPA, domain, title, approval state and the full roster.",
  },
  {
    type: "allocation",
    title: "Allocation report",
    detail:
      "Group to guide with the preference rank satisfied, method, and the reason for anything unallocated.",
  },
  {
    type: "attendance",
    title: "Attendance (per session)",
    detail: "One row per student per review session, with remarks.",
  },
  {
    type: "attendance-cumulative",
    title: "Attendance (cumulative)",
    detail:
      "One row per student, a column per session, with present/absent totals and a percentage.",
  },
  {
    type: "evaluation",
    title: "Evaluation report",
    detail: "Scores out of 10 and remarks per group per phase.",
  },
  {
    type: "titles",
    title: "Title registry",
    detail:
      "Imported corpus and submitted titles with their originality score and problem statements.",
  },
  {
    type: "reminders",
    title: "Reminder schedule",
    detail: "Both reminder windows per event with dispatch status and attempts.",
  },
  {
    type: "faculty-load",
    title: "Faculty load",
    detail: "Capacity, assigned count and the groups each guide holds this cycle.",
  },
];

export default async function ReportsPage() {
  await requirePage(["ADMIN"]);
  const cycle = await getSelectedCycle();

  if (!cycle) {
    return (
      <>
        <PageHeader title="Reports & Exports" role="Admin" />
        <Card>
          <CardBody>
            <p className="text-ink-secondary text-sm">No cycle selected.</p>
          </CardBody>
        </Card>
      </>
    );
  }

  const [students, groups, allocations, evaluations] = await Promise.all([
    prisma.studentCycle.count({ where: { cycleId: cycle.id } }),
    prisma.group.count({ where: { cycleId: cycle.id } }),
    prisma.allocation.count({ where: { cycleId: cycle.id, status: "ALLOCATED" } }),
    prisma.evaluation.count({ where: { session: { cycleId: cycle.id } } }),
  ]);

  return (
    <>
      <PageHeader
        title="Reports & Exports"
        subtitle="Nine cycle-wide reports as formatted Excel workbooks."
        cycleName={cycle.name}
        role="Admin"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students" value={students} meta="in this cycle" tone="info" />
        <StatCard label="Groups" value={groups} meta="formed" />
        <StatCard label="Allocated" value={allocations} meta="hold a guide" tone="success" />
        <StatCard label="Evaluations" value={evaluations} meta="recorded" />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Export centre"
          subtitle="Each workbook has a frozen, filtered header row and an About sheet recording who generated it and when."
        />
        <CardBody>
          <ul className="grid gap-3 lg:grid-cols-2">
            {REPORTS.map((report) => (
              <li
                key={report.type}
                className="border-border-subtle flex flex-wrap items-start justify-between gap-3 rounded-xl border p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-ink text-sm font-medium">{report.title}</p>
                  <p className="text-ink-secondary mt-0.5 text-xs leading-relaxed">
                    {report.detail}
                  </p>
                </div>
                <ExportButton type={report.type}>Download</ExportButton>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </>
  );
}
