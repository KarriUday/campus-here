import type { Metadata } from "next";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { NoGroupPanel } from "@/components/student/group-panel";
import { PreferencesForm } from "@/components/student/preferences-form";
import { getSelectedCycle } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/rbac";
import { findMyGroup } from "@/server/services/groups";

export const metadata: Metadata = { title: "Guide Preferences" };

export default async function PreferencesPage() {
  const session = await requirePage(["STUDENT"]);
  const cycle = await getSelectedCycle();
  const studentId = session.studentId;

  if (!cycle || !studentId) {
    return (
      <>
        <PageHeader title="Guide Preferences (1–6)" role="Student" />
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

  const group = await findMyGroup(studentId, cycle.id);

  if (!group) {
    return (
      <>
        <PageHeader
          title={`Guide Preferences (1–${cycle.prefCount})`}
          subtitle={`Rank exactly ${cycle.prefCount} guides.`}
          cycleName={cycle.name}
          role="Student"
        />
        <NoGroupPanel groupSize={cycle.groupSize} />
      </>
    );
  }

  const groupDomain = group.domain?.name ?? null;

  const faculty = await prisma.faculty.findMany({
    where: { isActive: true },
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      fullName: true,
      designation: true,
      capacity: true,
      domains: { select: { name: true } },
      _count: {
        select: {
          allocations: { where: { cycleId: cycle.id, status: "ALLOCATED" } },
        },
      },
    },
  });

  // Domain-matching guides first, since that is the allocation engine's
  // primary tie-break; alphabetical within each half.
  const guides = faculty
    .map((member) => ({
      id: member.id,
      fullName: member.fullName,
      designation: member.designation,
      domains: member.domains.map((d) => d.name),
      capacity: member.capacity,
      available: Math.max(0, member.capacity - member._count.allocations),
    }))
    .sort((a, b) => {
      const aMatch = groupDomain ? a.domains.includes(groupDomain) : false;
      const bMatch = groupDomain ? b.domains.includes(groupDomain) : false;
      if (aMatch !== bMatch) return aMatch ? -1 : 1;
      return a.fullName.localeCompare(b.fullName);
    });

  return (
    <>
      <PageHeader
        title={`Guide Preferences (1–${cycle.prefCount})`}
        subtitle={`Rank exactly ${cycle.prefCount} distinct guides for ${group.code}.`}
        cycleName={cycle.name}
        role="Student"
      />

      <PreferencesForm
        groupId={group.id}
        guides={guides}
        prefCount={cycle.prefCount}
        groupDomain={groupDomain}
        locked={Boolean(group.lockedAt)}
        initial={group.preferences.map((pref) => pref.facultyId)}
      />
    </>
  );
}
