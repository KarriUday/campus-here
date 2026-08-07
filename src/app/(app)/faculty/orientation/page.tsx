import type { Metadata } from "next";
import { NotBuiltYet } from "@/components/ui/not-built-yet";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Orientation" };

export default async function Page() {
  await requirePage(["FACULTY"]);
  const cycle = await getSelectedCycle();

  return (
    <>
      <PageHeader
        title="Orientation"
        subtitle="Post a text or audio orientation for students in this cycle."
        cycleName={cycle?.name}
        role="Faculty"
      />
      <NotBuiltYet
        phase="Phase K"
        summary="Create orientations for your students. Unlike the prototype, this screen is scoped to you: you can only delete your own posts."
      />
    </>
  );
}
