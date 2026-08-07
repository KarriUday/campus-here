import type { Metadata } from "next";
import { NotBuiltYet } from "@/components/ui/not-built-yet";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Settings" };

export default async function Page() {
  await requirePage(["ADMIN"]);
  const cycle = await getSelectedCycle();

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Configure domains, capacity defaults and cycle windows."
        cycleName={cycle?.name}
        role="Admin"
      />
      <NotBuiltYet
        phase="Phase F"
        summary="Domain master data and per-designation guide capacity rules, both of which the allocation engine reads."
      />
    </>
  );
}
