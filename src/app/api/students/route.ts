import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/rbac";
import { badRequest, resolveCycle } from "@/server/http";

const PAGE_SIZE = 50;

export async function GET(request: Request) {
  // Faculty legitimately need the roster to pick recipients and mark
  // attendance, so they may read it; only admins may modify it.
  const auth = await requireApi(["ADMIN", "FACULTY"]);
  if (!auth.ok) return auth.response;

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  const grouped = url.searchParams.get("grouped");

  const where = {
    enrollments: { some: { cycleId: cycle.id } },
    ...(query
      ? {
          OR: [
            { usn: { contains: query, mode: "insensitive" as const } },
            { fullName: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(grouped === "yes"
      ? { memberships: { some: { cycleId: cycle.id } } }
      : grouped === "no"
        ? { memberships: { none: { cycleId: cycle.id } } }
        : {}),
  };

  const [total, students] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      orderBy: [{ cgpa: "desc" }, { usn: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        usn: true,
        fullName: true,
        email: true,
        phone: true,
        cgpa: true,
        memberships: {
          where: { cycleId: cycle.id },
          select: { group: { select: { code: true, status: true } } },
        },
      },
    }),
  ]);

  return NextResponse.json({
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    students: students.map((student) => ({
      id: student.id,
      usn: student.usn,
      fullName: student.fullName,
      email: student.email,
      phone: student.phone,
      cgpa: Number(student.cgpa),
      group: student.memberships[0]?.group ?? null,
    })),
  });
}

/**
 * Remove the cycle's roster. This unenrols students from this cycle and drops
 * the groups formed inside it; the person and their login survive, because
 * they may also belong to another cycle.
 */
export async function DELETE(request: Request) {
  const auth = await requireApi(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  const result = await prisma.$transaction(async (tx) => {
    const groups = await tx.group.deleteMany({ where: { cycleId: cycle.id } });
    const enrollments = await tx.studentCycle.deleteMany({
      where: { cycleId: cycle.id },
    });
    return { groups: groups.count, enrollments: enrollments.count };
  });

  return NextResponse.json({ ok: true, ...result });
}
