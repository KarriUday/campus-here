import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/rbac";

export async function GET() {
  const auth = await requireApi();
  if (!auth.ok) return auth.response;

  // Read through to the database rather than trusting the token alone, so a
  // deactivated account stops working before its 8-hour token expires.
  const user = await prisma.user.findUnique({
    where: { id: auth.session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      student: { select: { id: true, usn: true, cgpa: true } },
      faculty: { select: { id: true, designation: true, capacity: true } },
    },
  });

  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Account is not active." }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      ...user,
      student: user.student
        ? { ...user.student, cgpa: Number(user.student.cgpa) }
        : null,
    },
  });
}
