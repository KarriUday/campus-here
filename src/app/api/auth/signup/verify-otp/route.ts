import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signSession, setSessionCookie, dashboardPathFor } from "@/lib/auth";

const Schema = z.object({
  email: z.string().email(),
  usn: z.string().min(3).max(20),
  code: z.string().length(6).regex(/^\d+$/),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = Schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const { email, usn, code, password } = parsed.data;
  const emailLower = email.trim().toLowerCase();
  const usnUpper = usn.trim().toUpperCase();

  // Verify the OTP
  const otp = await prisma.otpCode.findFirst({
    where: {
      email: emailLower,
      purpose: "SIGNUP",
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp || otp.codeHash !== hashCode(code)) {
    return NextResponse.json(
      { error: "Invalid or expired OTP. Please request a new code." },
      { status: 400 },
    );
  }

  // Mark OTP as used before proceeding
  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { used: true },
  });

  const passwordHash = await bcrypt.hash(password, 12);

  // Check if student exists by USN
  let student = await prisma.student.findUnique({
    where: { usn: usnUpper },
    include: { user: true },
  });

  // Get active cycle to ensure student is enrolled
  const activeCycle = await prisma.projectCycle.findFirst({
    where: { isActive: true },
    select: { id: true },
  });

  let user;

  if (student) {
    // If student has an existing user account, update credentials and set to PENDING approval
    if (student.user) {
      user = await prisma.user.update({
        where: { id: student.user.id },
        data: {
          email: emailLower,
          passwordHash,
          approvalStatus: "PENDING",
          isActive: false,
        },
        include: { student: { select: { id: true } } },
      });
      await prisma.student.update({
        where: { id: student.id },
        data: { email: emailLower },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email: emailLower,
          name: student.fullName,
          role: "STUDENT",
          passwordHash,
          approvalStatus: "PENDING",
          isActive: false,
          student: { connect: { id: student.id } },
        },
        include: { student: { select: { id: true } } },
      });
    }
  } else {
    // Brand new student registration
    user = await prisma.user.create({
      data: {
        email: emailLower,
        name: usnUpper,
        role: "STUDENT",
        passwordHash,
        approvalStatus: "PENDING",
        isActive: false,
        student: {
          create: {
            usn: usnUpper,
            fullName: usnUpper,
            email: emailLower,
            cgpa: 0,
            ...(activeCycle ? { enrollments: { create: { cycleId: activeCycle.id } } } : {}),
          },
        },
      },
      include: { student: { select: { id: true } } },
    });
  }

  // Do NOT log the student in immediately; require admin approval
  return NextResponse.json({
    ok: true,
    pendingApproval: true,
    message:
      "Your account has been registered and is pending administrator approval. You will be able to sign in once an administrator approves your account.",
  });
}
