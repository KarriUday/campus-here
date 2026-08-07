import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/rbac";
import { badRequest } from "@/server/http";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export async function GET() {
  const auth = await requireApi(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const [domains, capacityRules, cycles] = await Promise.all([
    prisma.domain.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { faculty: true, groups: true } } },
    }),
    prisma.capacityRule.findMany({ orderBy: { designation: "asc" } }),
    prisma.projectCycle.findMany({ orderBy: { code: "asc" } }),
  ]);

  return NextResponse.json({
    domains: domains.map((domain) => ({
      id: domain.id,
      name: domain.name,
      slug: domain.slug,
      description: domain.description,
      isActive: domain.isActive,
      sortOrder: domain.sortOrder,
      facultyCount: domain._count.faculty,
      groupCount: domain._count.groups,
    })),
    capacityRules,
    cycles,
  });
}

const DomainSchema = z.object({
  name: z.string().min(2).max(60),
  description: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  const auth = await requireApi(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const parsed = DomainSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid request.");
  }

  const slug = slugify(parsed.data.name);
  if (!slug) return badRequest("Domain name must contain letters or digits.");

  const existing = await prisma.domain.findUnique({ where: { slug } });
  if (existing) return badRequest("A domain with that name already exists.");

  const domain = await prisma.domain.create({
    data: {
      name: parsed.data.name.trim(),
      slug,
      description: parsed.data.description?.trim() || null,
      isActive: true,
      sortOrder: 50,
    },
  });

  return NextResponse.json({ ok: true, domain });
}

const PatchSchema = z.object({
  domain: z
    .object({
      id: z.string(),
      isActive: z.boolean().optional(),
      name: z.string().min(2).max(60).optional(),
      description: z.string().max(200).nullable().optional(),
    })
    .optional(),
  capacityRule: z
    .object({
      designation: z.enum([
        "ASSISTANT_PROFESSOR",
        "ASSOCIATE_PROFESSOR",
        "PROFESSOR",
      ]),
      maxGroups: z.number().int().min(1).max(10),
      /** Also push the new default onto guides of that designation. */
      applyToExisting: z.boolean().optional(),
    })
    .optional(),
});

export async function PATCH(request: Request) {
  const auth = await requireApi(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const parsed = PatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid request.");
  }

  const { domain, capacityRule } = parsed.data;
  if (!domain && !capacityRule) return badRequest("Nothing to update.");

  const result = await prisma.$transaction(async (tx) => {
    const changed: Record<string, unknown> = {};

    if (domain) {
      changed.domain = await tx.domain.update({
        where: { id: domain.id },
        data: {
          ...(domain.isActive === undefined ? {} : { isActive: domain.isActive }),
          ...(domain.name === undefined
            ? {}
            : { name: domain.name.trim(), slug: slugify(domain.name) }),
          ...(domain.description === undefined
            ? {}
            : { description: domain.description }),
        },
      });
    }

    if (capacityRule) {
      changed.capacityRule = await tx.capacityRule.upsert({
        where: { designation: capacityRule.designation },
        create: {
          designation: capacityRule.designation,
          maxGroups: capacityRule.maxGroups,
        },
        update: { maxGroups: capacityRule.maxGroups },
      });

      if (capacityRule.applyToExisting) {
        const updated = await tx.faculty.updateMany({
          where: { designation: capacityRule.designation },
          data: { capacity: capacityRule.maxGroups },
        });
        changed.facultyUpdated = updated.count;
      }
    }

    return changed;
  });

  return NextResponse.json({ ok: true, ...result });
}
