import type { Metadata } from "next";
import { NotBuiltYet } from "@/components/ui/not-built-yet";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Domain & Problem Statement" };

export default async function Page() {
  await requirePage(["STUDENT"]);
  const cycle = await getSelectedCycle();

  return (
    <>
      <PageHeader
        title="Domain & Problem Statement"
        subtitle="Pick a domain and submit your statement with live duplicate checking."
        cycleName={cycle?.name}
        role="Student"
      />
      <NotBuiltYet
        phase="Phase H"
        summary="A real domain picker and problem-statement form with a live originality score, the top five similar titles, and a hard block above 95%."
      />
    </>
  );
}
