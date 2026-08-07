import type { Metadata } from "next";
import { NotBuiltYet } from "@/components/ui/not-built-yet";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Allocation" };

export default async function Page() {
  await requirePage(["ADMIN"]);
  const cycle = await getSelectedCycle();

  return (
    <>
      <PageHeader
        title="Allocation"
        subtitle="Merit-first allocation with 6 preferences and a manual fallback queue."
        cycleName={cycle?.name}
        role="Admin"
      />
      <NotBuiltYet
        phase="Phase I"
        summary="The Gale-Shapley matching engine with a dry-run preview, a committed run inside a serializable transaction, run history, and a manual-assignment queue for unmatched groups."
      />
    </>
  );
}
