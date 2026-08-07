import type { Metadata } from "next";
import { NotBuiltYet } from "@/components/ui/not-built-yet";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "My Group" };

export default async function Page() {
  await requirePage(["STUDENT"]);
  const cycle = await getSelectedCycle();

  return (
    <>
      <PageHeader
        title="My Group"
        subtitle="Members, average CGPA, domain and submission lock state."
        cycleName={cycle?.name}
        role="Student"
      />
      <NotBuiltYet
        phase="Phase H"
        summary="Your group&apos;s real roster, its database-computed average CGPA, and its lock state after submission."
      />
    </>
  );
}
