import type { Metadata } from "next";
import { NotBuiltYet } from "@/components/ui/not-built-yet";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Mail Center" };

export default async function Page() {
  await requirePage(["FACULTY"]);
  const cycle = await getSelectedCycle();

  return (
    <>
      <PageHeader
        title="Mail Center"
        subtitle="Email your assigned students, delivered over SMTP with in-app alerts."
        cycleName={cycle?.name}
        role="Faculty"
      />
      <NotBuiltYet
        phase="Phase K"
        summary="Send to your own groups with BCC, attachments and a send history. Dry-run by default until credentials are configured."
      />
    </>
  );
}
