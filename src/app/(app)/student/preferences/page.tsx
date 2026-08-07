import type { Metadata } from "next";
import { NotBuiltYet } from "@/components/ui/not-built-yet";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Guide Preferences (1–6)" };

export default async function Page() {
  await requirePage(["STUDENT"]);
  const cycle = await getSelectedCycle();

  return (
    <>
      <PageHeader
        title="Guide Preferences (1–6)"
        subtitle="Rank exactly 6 guides from your domain pool."
        cycleName={cycle?.name}
        role="Student"
      />
      <NotBuiltYet
        phase="Phase H"
        summary="Six ranked guide preferences with cross-slot duplicate prevention, backed by a database uniqueness constraint."
      />
    </>
  );
}
