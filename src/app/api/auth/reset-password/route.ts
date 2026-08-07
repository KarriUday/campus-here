import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ResetSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password is too long."),
});

export async function POST(request: Request) {
  const parsed = ResetSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const tokenHash = createHash("sha256")
    .update(parsed.data.token)
    .digest("hex");

  const user = await prisma.user.findFirst({
    where: { resetTokenHash: tokenHash, resetTokenExpiry: { gt: new Date() } },
  });

  if (!user) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired." },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      // Single use.
      resetTokenHash: null,
      resetTokenExpiry: null,
    },
  });

  return NextResponse.json({ ok: true });
}
