import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { dashboardPathFor, setSessionCookie, signSession } from "@/lib/auth";

const LoginSchema = z.object({
  email: z.email("Enter a valid email address."),
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

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
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
  if (!passwordMatches || !user.isActive) return invalid;

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
