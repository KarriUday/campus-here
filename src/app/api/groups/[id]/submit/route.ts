import { NextResponse } from "next/server";
import { requireApi } from "@/lib/rbac";
import { badRequest } from "@/server/http";
import { GroupError, submitGroup } from "@/server/services/groups";

/**
 * Final submission. Locks the group: membership, domain, title and
 * preferences all become immutable, which is what makes the allocation run
 * reproducible.
 */
export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/groups/[id]/submit">,
) {
  const auth = await requireApi(["STUDENT"]);
  if (!auth.ok) return auth.response;
  if (!auth.session.studentId) {
    return badRequest("This account is not linked to a student record.");
  }

  const { id } = await ctx.params;
  try {
    const group = await submitGroup(auth.session.studentId, id);
    return NextResponse.json({ ok: true, group });
  } catch (error) {
    if (error instanceof GroupError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
