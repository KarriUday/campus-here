import type { Metadata } from "next";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { NoGroupPanel } from "@/components/student/group-panel";
import { DomainForm } from "@/components/student/domain-form";
import { getSelectedCycle } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/rbac";
import { findMyGroup } from "@/server/services/groups";

export const metadata: Metadata = { title: "Domain & Problem Statement" };

export default async function DomainPage() {
  const session = await requirePage(["STUDENT"]);
  const cycle = await getSelectedCycle();
  const studentId = session.studentId;

  if (!cycle || !studentId) {
    return (
      <>
        <PageHeader title="Domain & Problem Statement" role="Student" />
        <Card>
          <CardBody>
            <p className="text-ink-secondary text-sm">
              This account is not linked to a student record.
            </p>
          </CardBody>
        </Card>
      </>
    );
  }

  const [group, domains] = await Promise.all([
    findMyGroup(studentId, cycle.id),
    prisma.domain.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, description: true },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Domain & Problem Statement"
        subtitle="Pick a domain and register your title. Originality is checked live against the whole corpus."
        cycleName={cycle.name}
        role="Student"
      />

      {group ? (
        <DomainForm
          groupId={group.id}
          domains={domains}
          initialDomainId={group.domainId}
          initialTitle={group.title?.title ?? ""}
          initialStatement={group.title?.problemStatement ?? ""}
          existingTitleId={group.title?.id}
          locked={Boolean(group.lockedAt)}
        />
      ) : (
        <NoGroupPanel groupSize={cycle.groupSize} />
      )}
    </>
  );
}
