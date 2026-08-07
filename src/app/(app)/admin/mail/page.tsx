import type { Metadata } from "next";
import { NotBuiltYet } from "@/components/ui/not-built-yet";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Mail Center" };

export default async function Page() {
  await requirePage(["ADMIN"]);
  const cycle = await getSelectedCycle();

  return (
    <>
      <PageHeader
        title="Mail Center"
        subtitle="Send SMTP email to students and deliver real-time in-app notifications."
        cycleName={cycle?.name}
        role="Admin"
      />
      <NotBuiltYet
        phase="Phase K"
        summary="Nodemailer with BCC bulk sending, attachments up to 20MB, a send history, and per-recipient delivery records. Dry-run by default."
      />
    </>
  );
}
