import type { Metadata } from "next";
import { NotBuiltYet } from "@/components/ui/not-built-yet";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Mark Attendance" };

export default async function Page() {
  await requirePage(["FACULTY"]);
  const cycle = await getSelectedCycle();

  return (
    <>
      <PageHeader
        title="Mark Attendance"
        subtitle="Batch-wise attendance marking, per review session."
        cycleName={cycle?.name}
        role="Faculty"
      />
      <NotBuiltYet
        phase="Phase K"
        summary="Per-student present/absent toggles that save to the database, with per-session and cumulative Excel export."
      />
    </>
  );
}
