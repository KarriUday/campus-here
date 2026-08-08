import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApi } from "@/lib/rbac";
import { badRequest, resolveCycle } from "@/server/http";
import { AllocationError, assignManually } from "@/server/services/allocation";

const ManualSchema = z.object({
  groupId: z.string().min(1),
  facultyId: z.string().min(1),
});

/**
 * Admin override for a group the engine could not place. A manual assignment
 * is never recomputed by a later run — it consumes the guide's capacity and
 * the group is taken out of the matching market.
 */
export async function POST(request: Request) {
  const auth = await requireApi(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  const parsed = ManualSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid request.");
  }

  try {
    const allocation = await assignManually(
      cycle.id,
      parsed.data.groupId,
      parsed.data.facultyId,
      auth.session.userId,
    );
    return NextResponse.json({ ok: true, allocation });
  } catch (error) {
    if (error instanceof AllocationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
