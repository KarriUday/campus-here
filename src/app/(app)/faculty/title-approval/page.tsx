import type { Metadata } from "next";
import { NotBuiltYet } from "@/components/ui/not-built-yet";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Title Approval" };

export default async function Page() {
  await requirePage(["FACULTY"]);
  const cycle = await getSelectedCycle();

  return (
    <>
      <PageHeader
        title="Title Approval"
        subtitle="Approve a final title and register it to prevent duplicates."
        cycleName={cycle?.name}
        role="Faculty"
      />
      <NotBuiltYet
        phase="Phase K"
        summary="Approve or reject proposed titles with the live similarity score and its matched terms shown alongside."
      />
    </>
  );
}
