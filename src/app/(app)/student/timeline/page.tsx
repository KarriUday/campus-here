import type { Metadata } from "next";
import { NotBuiltYet } from "@/components/ui/not-built-yet";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Review Timeline" };

export default async function Page() {
  await requirePage(["STUDENT"]);
  const cycle = await getSelectedCycle();

  return (
    <>
      <PageHeader
        title="Review Timeline"
        subtitle="R0 → P1 → P2 schedule with reminders and outcomes."
        cycleName={cycle?.name}
        role="Student"
      />
      <NotBuiltYet
        phase="Phase J"
        summary="Your group&apos;s real review sessions, drawn from the schedule rather than fixed placeholder rows."
      />
    </>
  );
}
