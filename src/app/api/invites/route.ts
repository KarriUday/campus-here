import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/rbac";
import { badRequest, resolveCycle } from "@/server/http";
import { formatCgpa } from "@/lib/utils";

/** Invites addressed to the signed-in student for the selected cycle. */
export async function GET(request: Request) {
  const auth = await requireApi(["STUDENT"]);
  if (!auth.ok) return auth.response;
  if (!auth.session.studentId) {
    return badRequest("This account is not linked to a student record.");
  }

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  const invites = await prisma.groupInvite.findMany({
    where: { toStudentId: auth.session.studentId, cycleId: cycle.id },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      fromStudent: { select: { fullName: true, usn: true } },
      group: {
        select: {
          code: true,
          avgCgpa: true,
          domain: { select: { name: true } },
          _count: { select: { members: true } },
        },
      },
    },
  });

  return NextResponse.json({
    invites: invites.map((invite) => ({
      id: invite.id,
      status: invite.status,
      expiresAt: invite.expiresAt,
      message: invite.message,
      from: invite.fromStudent,
      group: {
        code: invite.group.code,
        members: invite.group._count.members,
        avgCgpa: formatCgpa(Number(invite.group.avgCgpa)),
        domain: invite.group.domain?.name ?? null,
      },
    })),
  });
}
