import type { Metadata } from "next";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { TitleApprovals } from "@/components/faculty/title-approvals";
import { ExportButton } from "@/components/reports/export-button";
import { getSelectedCycle } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Title Approval" };

/** Shape of the stored similarityReport we read the explanation from. */
type StoredReport = {
  best?: { title?: string; sharedTerms?: string[] } | null;
};

export default async function TitleApprovalPage() {
  const session = await requirePage(["FACULTY"]);
  const cycle = await getSelectedCycle();
  const facultyId = session.facultyId;

  if (!cycle || !facultyId) {
    return (
      <>
        <PageHeader title="Title Approval" role="Faculty" />
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

  const titles = await prisma.projectTitle.findMany({
    where: {
      cycleId: cycle.id,
      source: "STUDENT_SUBMISSION",
      group: { allocation: { facultyId, status: "ALLOCATED" } },
    },
    orderBy: [{ approvalStatus: "asc" }, { updatedAt: "desc" }],
    include: {
      group: { select: { code: true } },
      domain: { select: { name: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Title Approval"
        subtitle="Approve a final title and register it, or send it back with a reason."
        cycleName={cycle.name}
        role="Faculty"
        actions={<ExportButton type="titles">Export titles</ExportButton>}
      />

      <TitleApprovals
        titles={titles.map((row) => {
          const report = (row.similarityReport ?? null) as StoredReport | null;
          return {
            id: row.id,
            groupCode: row.group?.code ?? "—",
            title: row.title,
            problemStatement: row.problemStatement,
            domain: row.domain?.name ?? row.domainLabel,
            approvalStatus: row.approvalStatus,
            similarityScore:
              row.similarityScore === null ? null : Number(row.similarityScore),
            bestMatch: report?.best?.title ?? null,
            sharedTerms: report?.best?.sharedTerms ?? [],
          };
        })}
      />
    </>
  );
}
