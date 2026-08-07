import type { Metadata } from "next";
import { NotBuiltYet } from "@/components/ui/not-built-yet";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Notifications" };

export default async function Page() {
  await requirePage(["STUDENT"]);
  const cycle = await getSelectedCycle();

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Real-time email alerts from your guide."
        cycleName={cycle?.name}
        role="Student"
      />
      <NotBuiltYet
        phase="Phase K"
        summary="Your in-app inbox, delivered over server-sent events with a polling fallback."
      />
    </>
  );
}
