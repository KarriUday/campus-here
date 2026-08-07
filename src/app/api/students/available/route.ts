import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/rbac";
import { badRequest, resolveCycle } from "@/server/http";

/**
 * Students in this cycle who are not yet in a group — the pool the invite
 * search draws from.
 *
 * The prototype hardcoded the "self" USN to exclude, which meant it filtered
 * out the wrong person for anyone except the demo account. Here it excludes
 * the caller by their actual session identity.
 */
export async function GET(request: Request) {
  const auth = await requireApi(["STUDENT"]);
  if (!auth.ok) return auth.response;
  if (!auth.session.studentId) {
    return badRequest("This account is not linked to a student record.");
  }

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  const query = (new URL(request.url).searchParams.get("q") ?? "").trim();

  const students = await prisma.student.findMany({
    where: {
      id: { not: auth.session.studentId },
      enrollments: { some: { cycleId: cycle.id } },
      memberships: { none: { cycleId: cycle.id } },
      ...(query
        ? {
            OR: [
              { usn: { contains: query, mode: "insensitive" as const } },
              { fullName: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: [{ cgpa: "desc" }, { usn: "asc" }],
    take: 25,
    select: { id: true, usn: true, fullName: true, cgpa: true },
  });

  return NextResponse.json({
    students: students.map((student) => ({
      ...student,
      cgpa: Number(student.cgpa),
    })),
  });
}
