import type { Metadata } from "next";
import { NotBuiltYet } from "@/components/ui/not-built-yet";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Calendar PDF → Reminders" };

export default async function Page() {
  await requirePage(["ADMIN"]);
  const cycle = await getSelectedCycle();

  return (
    <>
      <PageHeader
        title="Calendar PDF → Reminders"
        subtitle="Upload a PDF calendar, extract its text, detect review dates, and generate reminders."
        cycleName={cycle?.name}
        role="Admin"
      />
      <NotBuiltYet
        phase="Phase J"
        summary="Server-side PDF text extraction, review-date and phase detection, and generation of both 15-day and 7-day reminders at 09:00 IST."
      />
    </>
  );
}
