import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signSession, setSessionCookie, dashboardPathFor } from "@/lib/auth";

const Schema = z.object({
  email: z.string().min(1),
  code: z.string().length(6).regex(/^\d+$/),
});

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = Schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input." },
      { status: 400 },
    );
  }

  const { email: input, code } = parsed.data;
  const inputLower = input.trim().toLowerCase();

  // Find user by email or USN
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: inputLower },
        { student: { usn: input.trim().toUpperCase() } },
        { student: { email: inputLower } },
      ],
    },
    include: {
      student: { select: { id: true } },
      faculty: { select: { id: true } },
    },
  });

  if (!user || !user.isActive) {
    return NextResponse.json(
      { error: "Account not found or disabled." },
      { status: 401 },
    );
  }

  // Check OTP using user's actual email
  const otp = await prisma.otpCode.findFirst({
    where: {
      email: user.email,
      purpose: "LOGIN",
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp || otp.codeHash !== hashCode(code)) {
    return NextResponse.json(
      { error: "Invalid or expired OTP. Please request a new code." },
      { status: 401 },
    );
  }

  // Mark OTP as used
  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { used: true },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const token = await signSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    studentId: user.student?.id,
    facultyId: user.faculty?.id,
  });
  await setSessionCookie(token);

  return NextResponse.json({ ok: true, redirectTo: dashboardPathFor(user.role) });
}
