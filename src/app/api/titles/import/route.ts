import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/rbac";
import { badRequest, readUploadedCsv, resolveCycle } from "@/server/http";
import { parseTitleImport } from "@/server/services/csv";
import { normalizeTitle } from "@/server/services/similarity";

/**
 * Seed the originality corpus with previous batches' titles.
 *
 * Accepts one title per line, or a CSV using the headers spec §3.4 documents
 * (`title, group, domain, guide, cycle`) and its aliases.
 */
export async function POST(request: Request) {
  const auth = await requireApi(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  const upload = await readUploadedCsv(request);
  if ("error" in upload) return upload.error;

  const result = parseTitleImport(upload.text);

  // Titles already in the corpus are skipped rather than reported as errors:
  // re-uploading last year's list should be idempotent.
  const existing = await prisma.projectTitle.findMany({
    where: { source: "IMPORTED_CORPUS" },
    select: { normalizedTitle: true },
  });
  const known = new Set(existing.map((row) => row.normalizedTitle));

  const rows = result.valid.map((row) => ({
    ...row,
    normalized: normalizeTitle(row.title),
  }));
  const fresh = rows.filter((row) => row.normalized && !known.has(row.normalized));
  const duplicates = rows.length - fresh.length;

  if (!upload.apply) {
    return NextResponse.json({
      applied: false,
      totalRows: result.totalRows,
      validCount: fresh.length,
      duplicateCount: duplicates,
      errorCount: result.issues.length,
      preview: fresh.slice(0, 8).map((row) => ({
        title: row.title,
        normalized: row.normalized,
        domainLabel: row.domainLabel,
        guideLabel: row.guideLabel,
        cycleLabel: row.cycleLabel,
      })),
      issues: result.issues.slice(0, 50),
    });
  }

  if (fresh.length === 0) {
    return badRequest("Nothing new to import.", {
      totalRows: result.totalRows,
      duplicateCount: duplicates,
      issues: result.issues.slice(0, 50),
    });
  }

  const summary = await prisma.$transaction(async (tx) => {
    const created = await tx.projectTitle.createMany({
      data: fresh.map((row) => ({
        cycleId: cycle.id,
        title: row.title,
        normalizedTitle: row.normalized,
        domainLabel: row.domainLabel,
        guideLabel: row.guideLabel,
        groupLabel: row.groupLabel,
        cycleLabel: row.cycleLabel,
        source: "IMPORTED_CORPUS" as const,
        approvalStatus: "APPROVED" as const,
      })),
    });

    const batch = await tx.importBatch.create({
      data: {
        cycleId: cycle.id,
        entity: "TITLES",
        source: "CSV",
        totalRows: result.totalRows,
        successRows: created.count,
        failedRows: result.issues.length,
        errors: result.issues.slice(0, 200),
        appliedById: auth.session.userId,
      },
    });

    return { batchId: batch.id, imported: created.count };
  });

  return NextResponse.json({
    applied: true,
    totalRows: result.totalRows,
    duplicateCount: duplicates,
    errorCount: result.issues.length,
    ...summary,
    issues: result.issues.slice(0, 50),
  });
}
