import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/rbac";
import { badRequest, notFound } from "@/server/http";

const ReviewSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().max(500).optional(),
});

/**
 * A guide approves or rejects their own group's title.
 *
 * Approving registers it: the title stays in the corpus that future
 * originality checks score against. Rejecting requires a reason, since the
 * students have to act on it.
 */
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/titles/[id]/review">,
) {
  const auth = await requireApi(["ADMIN", "FACULTY"]);
  if (!auth.ok) return auth.response;

  const parsed = ReviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid request.");
  }
  if (parsed.data.decision === "REJECT" && !parsed.data.reason?.trim()) {
    return badRequest("Give a reason so the group knows what to change.");
  }

  const { id } = await ctx.params;
  const title = await prisma.projectTitle.findUnique({
    where: { id },
    include: {
      group: { select: { allocation: { select: { facultyId: true } } } },
    },
  });
  if (!title) return notFound("No such title.");
  if (title.source === "IMPORTED_CORPUS") {
    return badRequest("Imported corpus entries are not reviewed.");
  }

  if (
    auth.session.role === "FACULTY" &&
    title.group?.allocation?.facultyId !== auth.session.facultyId
  ) {
    return NextResponse.json(
      { error: "You can only review titles for groups you guide." },
      { status: 403 },
    );
  }

  const updated = await prisma.projectTitle.update({
    where: { id },
    data: {
      approvalStatus: parsed.data.decision === "APPROVE" ? "APPROVED" : "REJECTED",
      rejectionReason:
        parsed.data.decision === "REJECT" ? parsed.data.reason!.trim() : null,
      reviewedById: auth.session.userId,
      reviewedAt: new Date(),
    },
    select: { id: true, title: true, approvalStatus: true },
  });

  return NextResponse.json({ ok: true, title: updated });
}
