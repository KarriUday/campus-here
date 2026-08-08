import type { Metadata } from "next";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { OrientationPanel } from "@/components/comms/orientation-panel";
import { getSelectedCycle } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Orientation" };

export default async function OrientationPage() {
  const session = await requirePage(["ADMIN"]);
  const cycle = await getSelectedCycle();

  if (!cycle) {
    return (
      <>
        <PageHeader title="Orientation" role="Admin" />
        <Card>
          <CardBody>
            <p className="text-ink-secondary text-sm">No cycle selected.</p>
          </CardBody>
        </Card>
      </>
    );
  }

  const orientations = await prisma.orientation.findMany({
    where: { cycleId: cycle.id },
    orderBy: { createdAt: "desc" },
    include: { postedBy: { select: { id: true, name: true } } },
  });

  return (
    <>
      <PageHeader
        title="Orientation"
        subtitle="Post a text or audio orientation that appears on every student dashboard."
        cycleName={cycle.name}
        role="Admin"
      />

      <OrientationPanel
        canPost
        defaultPostedBy="Coordinator"
        orientations={orientations.map((row) => ({
          id: row.id,
          type: row.type,
          title: row.title,
          summary: row.summary,
          text: row.text,
          note: row.note,
          postedByLabel: row.postedByLabel,
          postedByName: row.postedBy.name,
          audioUrl: row.audioFileId ? `/api/orientation/${row.id}/audio` : null,
          createdAt: row.createdAt.toISOString(),
          // Authorship, not role: a guide may only delete what they posted.
          canDelete:
            session.role === "ADMIN" || row.postedById === session.userId,
        }))}
      />
    </>
  );
}
