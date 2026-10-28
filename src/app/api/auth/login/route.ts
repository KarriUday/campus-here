import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { dashboardPathFor, setSessionCookie, signSession } from "@/lib/auth";

const LoginSchema = z.object({
  email: z.string().min(1, "Please enter your email or USN."),
  password: z.string().min(1, "Password is required."),
});

export async function POST(request: Request) {
  const parsed = LoginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const rawInput = parsed.data.email.trim();
  const inputLower = rawInput.toLowerCase();
  const usnUpper = rawInput.toUpperCase();
  const possibleBmsitEmail = rawInput.includes("@") ? inputLower : `${inputLower}@bmsit.in`;

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: inputLower },
        { email: possibleBmsitEmail },
        { student: { usn: usnUpper } },
        { student: { email: inputLower } },
      ],
    },
    include: {
      student: { select: { id: true } },
      faculty: { select: { id: true } },
    },
  });

  // One message for "no such user", "wrong password" and "disabled account",
  // so the endpoint cannot be used to enumerate valid addresses.
  const invalid = NextResponse.json(
    { error: "Incorrect email or password." },
    { status: 401 },
  );

  if (!user) {
    // Spend comparable time on a miss so response timing does not leak
    // whether the address exists.
    await bcrypt.compare(parsed.data.password, "$2b$10$invalidsaltinvalidsaltuO");
    return invalid;
  }

  const passwordMatches = await bcrypt.compare(
    parsed.data.password,
    user.passwordHash,
  );
  if (!passwordMatches) return invalid;

  if (user.approvalStatus === "PENDING") {
    return NextResponse.json(
      {
        error:
          "Your account is pending administrator approval. Please wait for an administrator to approve your registration before signing in.",
      },
      { status: 403 },
    );
  }

  if (user.approvalStatus === "REJECTED") {
    return NextResponse.json(
      {
        error:
          "Your registration was rejected by the administrator. Please contact your department coordinator.",
      },
      { status: 403 },
    );
  }

  if (!user.isActive) return invalid;

  const token = await signSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    studentId: user.student?.id,
    facultyId: user.faculty?.id,
  });
  await setSessionCookie(token);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return NextResponse.json({
    user: { name: user.name, email: user.email, role: user.role },
    redirectTo: dashboardPathFor(user.role),
  });
}
