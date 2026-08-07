import type { Metadata } from "next";
import { NotBuiltYet } from "@/components/ui/not-built-yet";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Evaluate Groups" };

export default async function Page() {
  await requirePage(["FACULTY"]);
  const cycle = await getSelectedCycle();

  return (
    <>
      <PageHeader
        title="Evaluate Groups"
        subtitle="Enter score and remarks; exportable for the coordinator."
        cycleName={cycle?.name}
        role="Faculty"
      />
      <NotBuiltYet
        phase="Phase K"
        summary="A real score-out-of-10 and remarks form saved per group per phase, with Excel export."
      />
    </>
  );
}
