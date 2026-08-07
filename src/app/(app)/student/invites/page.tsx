import type { Metadata } from "next";
import { NotBuiltYet } from "@/components/ui/not-built-yet";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Invites" };

export default async function Page() {
  await requirePage(["STUDENT"]);
  const cycle = await getSelectedCycle();

  return (
    <>
      <PageHeader
        title="Invites"
        subtitle="Send requests to other students and manage incoming invites."
        cycleName={cycle?.name}
        role="Student"
      />
      <NotBuiltYet
        phase="Phase H"
        summary="Search unattached students, send invites, and accept or reject incoming ones. Accepting enforces one group per cycle at the database level."
      />
    </>
  );
}
