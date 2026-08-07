import type { Metadata } from "next";
import { NotBuiltYet } from "@/components/ui/not-built-yet";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Students" };

export default async function Page() {
  await requirePage(["ADMIN"]);
  const cycle = await getSelectedCycle();

  return (
    <>
      <PageHeader
        title="Students"
        subtitle="Search, filter, and see group membership and CGPA."
        cycleName={cycle?.name}
        role="Admin"
      />
      <NotBuiltYet
        phase="Phase F"
        summary="The full student directory for the cycle with search, CGPA sorting and group membership."
      />
    </>
  );
}
