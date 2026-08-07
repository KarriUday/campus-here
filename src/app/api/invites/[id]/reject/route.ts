import { NextResponse } from "next/server";
import { requireApi } from "@/lib/rbac";
import { badRequest } from "@/server/http";
import { GroupError, rejectInvite } from "@/server/services/groups";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/invites/[id]/reject">,
) {
  const auth = await requireApi(["STUDENT"]);
  if (!auth.ok) return auth.response;
  if (!auth.session.studentId) {
    return badRequest("This account is not linked to a student record.");
  }

  const { id } = await ctx.params;
  try {
    const invite = await rejectInvite(auth.session.studentId, id);
    return NextResponse.json({ ok: true, invite: { id: invite.id, status: invite.status } });
  } catch (error) {
    if (error instanceof GroupError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
