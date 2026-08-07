import type { Metadata } from "next";
import { NotBuiltYet } from "@/components/ui/not-built-yet";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Reviews & Scheduling" };

export default async function Page() {
  await requirePage(["ADMIN"]);
  const cycle = await getSelectedCycle();

  return (
    <>
      <PageHeader
        title="Reviews & Scheduling"
        subtitle="Schedule Review 0, P1 and P2 with venue, time and reminder jobs."
        cycleName={cycle?.name}
        role="Admin"
      />
      <NotBuiltYet
        phase="Phase J"
        summary="Review session scheduling with venue and time conflict detection, plus the queued reminder jobs for each session."
      />
    </>
  );
}
