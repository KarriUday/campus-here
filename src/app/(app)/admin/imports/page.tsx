import type { Metadata } from "next";
import { NotBuiltYet } from "@/components/ui/not-built-yet";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Data Ingestion (Upload)" };

export default async function Page() {
  await requirePage(["ADMIN"]);
  const cycle = await getSelectedCycle();

  return (
    <>
      <PageHeader
        title="Data Ingestion (Upload)"
        subtitle="Upload student, faculty and previous-title data as CSV, validated server-side before it reaches the database."
        cycleName={cycle?.name}
        role="Admin"
      />
      <NotBuiltYet
        phase="Phase F"
        summary="Student and faculty CSV upload with per-row validation, a preview of valid and rejected rows, an applied-import history, and sample CSV downloads."
      />
    </>
  );
}
