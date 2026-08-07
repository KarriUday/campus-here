import type { Metadata } from "next";
import { NotBuiltYet } from "@/components/ui/not-built-yet";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Title Registry & Duplication" };

export default async function Page() {
  await requirePage(["ADMIN"]);
  const cycle = await getSelectedCycle();

  return (
    <>
      <PageHeader
        title="Title Registry & Duplication"
        subtitle="Central title log plus similarity checks for problem statements."
        cycleName={cycle?.name}
        role="Admin"
      />
      <NotBuiltYet
        phase="Phase G"
        summary="The registered title log and the TF-IDF originality engine, replacing the prototype&apos;s hardcoded similarity numbers with real per-signal scores."
      />
    </>
  );
}
