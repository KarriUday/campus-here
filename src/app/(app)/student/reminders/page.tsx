import type { Metadata } from "next";
import { NotBuiltYet } from "@/components/ui/not-built-yet";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Reminders" };

export default async function Page() {
  await requirePage(["STUDENT"]);
  const cycle = await getSelectedCycle();

  return (
    <>
      <PageHeader
        title="Reminders"
        subtitle="Reminders generated from the admin-uploaded calendar PDF."
        cycleName={cycle?.name}
        role="Student"
      />
      <NotBuiltYet
        phase="Phase J"
        summary="Both the 15-day and 7-day reminders for each detected review date, with live due-status computation."
      />
    </>
  );
}
