import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/rbac";
import { badRequest, notFound, resolveCycle } from "@/server/http";

export async function GET(request: Request) {
  // Students need the guide list to build their preference ranking.
  const auth = await requireApi(["ADMIN", "FACULTY", "STUDENT"]);
  if (!auth.ok) return auth.response;

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  const url = new URL(request.url);
  const domainSlug = url.searchParams.get("domain");

  const faculty = await prisma.faculty.findMany({
    where: {
      isActive: true,
      ...(domainSlug ? { domains: { some: { slug: domainSlug } } } : {}),
    },
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      designation: true,
      capacity: true,
      employeeId: true,
      domains: { select: { id: true, name: true, slug: true } },
      // Load is per cycle: a guide taking two groups in Major still has room
      // in Mini, so the count must be scoped rather than global.
      _count: {
        select: {
          allocations: { where: { cycleId: cycle.id, status: "ALLOCATED" } },
        },
      },
    },
  });

  return NextResponse.json({
    cycle: { id: cycle.id, name: cycle.name },
    faculty: faculty.map((member) => {
      const assigned = member._count.allocations;
      return {
        id: member.id,
        fullName: member.fullName,
        email: member.email,
        phone: member.phone,
        employeeId: member.employeeId,
        designation: member.designation,
        capacity: member.capacity,
        assigned,
        available: Math.max(0, member.capacity - assigned),
        domains: member.domains,
      };
    }),
  });
}

const PatchSchema = z.object({
  id: z.string().min(1),
  capacity: z.number().int().min(1).max(10).optional(),
  isActive: z.boolean().optional(),
  domainIds: z.array(z.string()).optional(),
});

export async function PATCH(request: Request) {
  const auth = await requireApi(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const parsed = PatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid request.");
  }

  const { id, capacity, isActive, domainIds } = parsed.data;
  const exists = await prisma.faculty.findUnique({ where: { id } });
  if (!exists) return notFound("No such guide.");

  const updated = await prisma.faculty.update({
    where: { id },
    data: {
      ...(capacity === undefined ? {} : { capacity }),
      ...(isActive === undefined ? {} : { isActive }),
      ...(domainIds
        ? { domains: { set: domainIds.map((domainId) => ({ id: domainId })) } }
        : {}),
    },
    select: { id: true, capacity: true, isActive: true },
  });

  return NextResponse.json({ ok: true, faculty: updated });
}
