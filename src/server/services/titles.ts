import { prisma } from "@/lib/prisma";
import { buildCorpusIndex, type CorpusEntry, type CorpusIndex } from "./similarity";

/**
 * The corpus an originality check runs against: every title registered in this
 * cycle, plus every imported historical title regardless of which cycle it was
 * loaded into — previous batches' work stays relevant forever.
 */
export async function loadCorpusIndex(cycleId: string): Promise<CorpusIndex> {
  const titles = await prisma.projectTitle.findMany({
    where: {
      OR: [{ cycleId }, { source: "IMPORTED_CORPUS" }],
      approvalStatus: { not: "REJECTED" },
    },
    select: {
      id: true,
      title: true,
      normalizedTitle: true,
      domainLabel: true,
      guideLabel: true,
      cycleLabel: true,
      domain: { select: { name: true } },
      group: { select: { code: true } },
    },
  });

  const entries: CorpusEntry[] = titles.map((row) => ({
    id: row.id,
    title: row.title,
    normalizedTitle: row.normalizedTitle,
    domainLabel: row.domain?.name ?? row.domainLabel,
    guideLabel: row.guideLabel,
    cycleLabel: row.cycleLabel ?? row.group?.code ?? null,
  }));

  return buildCorpusIndex(entries);
}
