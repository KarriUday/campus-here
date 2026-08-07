import type { Metadata } from "next";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, StatCard } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { DuplicateChecker } from "@/components/titles/duplicate-checker";
import { getSelectedCycle } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Title Registry & Duplication" };

const STATUS_TONE: Record<string, BadgeTone> = {
  DRAFT: "neutral",
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "error",
};

export default async function TitlesPage() {
  await requirePage(["ADMIN"]);
  const cycle = await getSelectedCycle();

  if (!cycle) {
    return (
      <>
        <PageHeader title="Title Registry & Duplication" role="Admin" />
        <Card>
          <CardBody>
            <p className="text-ink-secondary text-sm">No cycle selected.</p>
          </CardBody>
        </Card>
      </>
    );
  }

  const [titles, corpusCount, submittedCount, flaggedCount] = await Promise.all([
    prisma.projectTitle.findMany({
      where: { cycleId: cycle.id },
      orderBy: [{ source: "asc" }, { createdAt: "desc" }],
      take: 200,
      select: {
        id: true,
        title: true,
        source: true,
        approvalStatus: true,
        similarityScore: true,
        domainLabel: true,
        guideLabel: true,
        cycleLabel: true,
        domain: { select: { name: true } },
        group: {
          select: {
            code: true,
            allocation: { select: { faculty: { select: { fullName: true } } } },
          },
        },
      },
    }),
    prisma.projectTitle.count({
      where: { source: "IMPORTED_CORPUS" },
    }),
    prisma.projectTitle.count({
      where: { cycleId: cycle.id, source: "STUDENT_SUBMISSION" },
    }),
    prisma.projectTitle.count({
      where: {
        cycleId: cycle.id,
        source: "STUDENT_SUBMISSION",
        similarityScore: { gte: 0.8 },
      },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Title Registry & Duplication"
        subtitle="Every registered title, plus a live originality check against the whole corpus."
        cycleName={cycle.name}
        role="Admin"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Corpus titles"
          value={corpusCount}
          meta="imported from previous batches"
          tone="info"
        />
        <StatCard
          label="Submitted this cycle"
          value={submittedCount}
          meta="registered by groups"
        />
        <StatCard
          label="Flagged"
          value={flaggedCount}
          meta="scored 80% or above"
          tone={flaggedCount > 0 ? "warning" : "success"}
        />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Originality check"
          subtitle="TF-IDF cosine against the corpus is the primary score; the four lexical signals below it are explainable cross-checks."
        />
        <CardBody>
          <DuplicateChecker label="Check a proposed title" />
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader
          title="Title registry"
          subtitle="Imported corpus entries and titles registered by groups in this cycle."
        />
        <CardBody>
          <DataTable
            rows={titles}
            rowKey={(row) => row.id}
            emptyTitle="No titles registered yet"
            emptyDescription="Import previous titles from Data Ingestion to seed the corpus."
            columns={[
              { key: "title", header: "Title", render: (row) => row.title },
              {
                key: "source",
                header: "Source",
                render: (row) => (
                  <Badge tone={row.source === "IMPORTED_CORPUS" ? "neutral" : "info"}>
                    {row.source === "IMPORTED_CORPUS" ? "Corpus" : "Submitted"}
                  </Badge>
                ),
              },
              {
                key: "group",
                header: "Group",
                render: (row) => (
                  <span className="mono">
                    {row.group?.code ?? row.cycleLabel ?? "—"}
                  </span>
                ),
              },
              {
                key: "domain",
                header: "Domain",
                render: (row) => row.domain?.name ?? row.domainLabel ?? "—",
              },
              {
                key: "guide",
                header: "Guide",
                render: (row) =>
                  row.group?.allocation?.faculty?.fullName ?? row.guideLabel ?? "—",
              },
              {
                key: "score",
                header: "Similarity",
                numeric: true,
                render: (row) => {
                  if (row.similarityScore === null) return "—";
                  const score = Number(row.similarityScore);
                  return (
                    <Badge
                      tone={
                        score >= 0.95 ? "error" : score >= 0.8 ? "warning" : "success"
                      }
                    >
                      {Math.round(score * 100)}%
                    </Badge>
                  );
                },
              },
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <Badge tone={STATUS_TONE[row.approvalStatus] ?? "neutral"}>
                    {row.approvalStatus}
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
