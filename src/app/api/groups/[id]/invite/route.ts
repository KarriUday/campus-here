import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApi } from "@/lib/rbac";
import { badRequest } from "@/server/http";
import { GroupError, inviteToGroup } from "@/server/services/groups";

const InviteSchema = z.object({
  /** USN or email of the student to invite. */
  identifier: z.string().min(3, "Enter a USN or email address."),
});

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/groups/[id]/invite">,
) {
  const auth = await requireApi(["STUDENT"]);
  if (!auth.ok) return auth.response;
  if (!auth.session.studentId) {
    return badRequest("This account is not linked to a student record.");
  }

  const parsed = InviteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid request.");
  }

  const { id } = await ctx.params;
  try {
    const result = await inviteToGroup(
      auth.session.studentId,
      id,
      parsed.data.identifier,
    );
    return NextResponse.json({
      ok: true,
      invite: { id: result.invite.id, status: result.invite.status },
      student: {
        usn: result.student.usn,
        fullName: result.student.fullName,
      },
    });
  } catch (error) {
    if (error instanceof GroupError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
