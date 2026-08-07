import type { Metadata } from "next";
import { NotBuiltYet } from "@/components/ui/not-built-yet";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Attendance & Evaluation" };

export default async function Page() {
  await requirePage(["ADMIN"]);
  const cycle = await getSelectedCycle();

  return (
    <>
      <PageHeader
        title="Attendance & Evaluation"
        subtitle="Faculty mark attendance and evaluations; admin reviews and exports."
        cycleName={cycle?.name}
        role="Admin"
      />
      <NotBuiltYet
        phase="Phase K"
        summary="Read-only admin view of per-session attendance and evaluation scores, with Excel export."
      />
    </>
  );
}
