import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/rbac";
import { badRequest, resolveCycle } from "@/server/http";
import {
  BLOCK_THRESHOLD,
  checkTitle,
  normalizeTitle,
} from "@/server/services/similarity";
import { loadCorpusIndex } from "@/server/services/titles";

export async function GET(request: Request) {
  const auth = await requireApi(["ADMIN", "FACULTY", "STUDENT"]);
  if (!auth.ok) return auth.response;

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  const url = new URL(request.url);
  const source = url.searchParams.get("source");
  const query = (url.searchParams.get("q") ?? "").trim();

  const titles = await prisma.projectTitle.findMany({
    where: {
      cycleId: cycle.id,
      ...(source === "corpus"
        ? { source: "IMPORTED_CORPUS" as const }
        : source === "submitted"
          ? { source: "STUDENT_SUBMISSION" as const }
          : {}),
      ...(query
        ? { title: { contains: query, mode: "insensitive" as const } }
        : {}),
    },
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
      createdAt: true,
      domain: { select: { name: true } },
      group: {
        select: {
          code: true,
          allocation: { select: { faculty: { select: { fullName: true } } } },
        },
      },
    },
  });

  return NextResponse.json({
    cycle: { id: cycle.id, name: cycle.name },
    total: titles.length,
    titles: titles.map((row) => ({
      id: row.id,
      title: row.title,
      source: row.source,
      approvalStatus: row.approvalStatus,
      similarityScore:
        row.similarityScore === null ? null : Number(row.similarityScore),
      domain: row.domain?.name ?? row.domainLabel,
      guide: row.group?.allocation?.faculty?.fullName ?? row.guideLabel,
      group: row.group?.code ?? null,
      cycleLabel: row.cycleLabel,
      createdAt: row.createdAt,
    })),
  });
}

const SaveSchema = z.object({
  groupId: z.string().min(1),
  title: z.string().min(3, "Title must be at least 3 characters.").max(300),
  problemStatement: z.string().max(4000).optional(),
  domainId: z.string().optional(),
  isExtension: z.boolean().default(false),
  proposedInnovations: z.string().max(4000).optional(),
  seniorReferenceId: z.string().optional(),
});

/**
 * Register a group's title.
 *
 * The similarity check is re-run here against the live corpus.
 * If similarity is high, the group can submit it as an Extension Track proposal
 * detailing their new novel features and innovations for faculty review.
 */
export async function POST(request: Request) {
  const auth = await requireApi(["ADMIN", "STUDENT"]);
  if (!auth.ok) return auth.response;

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  const parsed = SaveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid request.");
  }
  const {
    groupId,
    title,
    problemStatement,
    domainId,
    isExtension,
    proposedInnovations,
    seniorReferenceId,
  } = parsed.data;

  const group = await prisma.group.findFirst({
    where: { id: groupId, cycleId: cycle.id },
    include: {
      members: { select: { studentId: true } },
      title: { select: { id: true } },
    },
  });
  if (!group) return badRequest("No such group in this cycle.");

  // A student may only set their own group's title.
  if (auth.session.role === "STUDENT") {
    const isMember = group.members.some(
      (member) => member.studentId === auth.session.studentId,
    );
    if (!isMember) {
      return NextResponse.json(
        { error: "You can only submit a title for your own group." },
        { status: 403 },
      );
    }
    if (group.lockedAt) {
      return badRequest("This group is locked and can no longer be edited.");
    }
  }

  const index = await loadCorpusIndex(cycle.id);
  const report = checkTitle(title, index, { excludeId: group.title?.id });

  // If score is high (>= BLOCK_THRESHOLD) and NOT registered as an approved extension track
  if (report.score >= BLOCK_THRESHOLD && !isExtension) {
    return NextResponse.json(
      {
        error:
          "This title is effectively identical to an existing project. Choose a different title or submit it under the 'Extension & Innovation Track' with novel features.",
        report,
      },
      { status: 409 },
    );
  }

  const effectiveDomainId = domainId ?? group.domainId;
  const normalized = normalizeTitle(title);
  const similarityReport = JSON.parse(JSON.stringify(report));

  const saved = await prisma.$transaction(async (tx) => {
    if (domainId && domainId !== group.domainId) {
      await tx.group.update({
        where: { id: group.id },
        data: { domainId },
      });
    }

    return tx.projectTitle.upsert({
      where: { groupId: group.id },
      create: {
        cycleId: cycle.id,
        groupId: group.id,
        title,
        normalizedTitle: normalized,
        problemStatement: problemStatement ?? null,
        domainId: effectiveDomainId,
        source: "STUDENT_SUBMISSION",
        approvalStatus: "PENDING",
        similarityScore: report.score,
        similarityReport,
        isExtension: Boolean(isExtension),
        proposedInnovations: proposedInnovations ?? null,
        seniorReferenceId: seniorReferenceId ?? null,
      },
      update: {
        title,
        normalizedTitle: normalized,
        problemStatement: problemStatement ?? null,
        domainId: effectiveDomainId,
        approvalStatus: "PENDING",
        similarityScore: report.score,
        similarityReport,
        isExtension: Boolean(isExtension),
        proposedInnovations: proposedInnovations ?? null,
        seniorReferenceId: seniorReferenceId ?? null,
      },
      select: { id: true, title: true, approvalStatus: true, isExtension: true },
    });
  });

  return NextResponse.json({ ok: true, title: saved, report });
}
