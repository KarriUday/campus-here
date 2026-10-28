import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/rbac";

const ApprovalSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(["APPROVE", "REJECT"]),
});

export async function POST(request: Request) {
  const auth = await requireApi(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = ApprovalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request body." },
      { status: 400 },
    );
  }

  const { userId, action } = parsed.data;

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!existingUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      approvalStatus: action === "APPROVE" ? "APPROVED" : "REJECTED",
      isActive: action === "APPROVE",
    },
    select: {
      id: true,
      email: true,
      name: true,
      approvalStatus: true,
      isActive: true,
    },
  });

  return NextResponse.json({ ok: true, user: updatedUser });
}
