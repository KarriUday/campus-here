import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/rbac";
import {
  badRequest,
  defaultImportPassword,
  readUploadedCsv,
  resolveCycle,
} from "@/server/http";
import { validateFacultyRows } from "@/server/services/csv";

/** Slugify a domain name into the stable key used for lookup and URLs. */
function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  const auth = await requireApi(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  const upload = await readUploadedCsv(request);
  if ("error" in upload) return upload.error;

  const existing = await prisma.faculty.findMany({ select: { email: true } });
  const result = validateFacultyRows(
    upload.text,
    new Set(existing.map((f) => f.email)),
  );

  if (!upload.apply) {
    return NextResponse.json({
      applied: false,
      totalRows: result.totalRows,
      validCount: result.valid.length,
      errorCount: result.issues.length,
      preview: result.valid.slice(0, 8),
      issues: result.issues.slice(0, 50),
      truncatedIssues: Math.max(0, result.issues.length - 50),
    });
  }

  if (result.valid.length === 0) {
    return badRequest("Nothing to import — every row failed validation.", {
      totalRows: result.totalRows,
      issues: result.issues.slice(0, 50),
    });
  }

  const passwordHash = await bcrypt.hash(defaultImportPassword(), 12);

  const summary = await prisma.$transaction(async (tx) => {
    // Domains named in the file that do not exist yet are created inactive,
    // so an import cannot silently add options to the student-facing picker.
    const names = [...new Set(result.valid.flatMap((row) => row.domains))];
    for (const name of names) {
      await tx.domain.upsert({
        where: { slug: slugify(name) },
        update: {},
        create: { name, slug: slugify(name), isActive: false, sortOrder: 100 },
      });
    }
    const domains = await tx.domain.findMany();
    const domainIdBySlug = new Map(domains.map((d) => [d.slug, d.id]));

    let created = 0;
    let updated = 0;

    for (const row of result.valid) {
      const connect = row.domains
        .map((name) => domainIdBySlug.get(slugify(name)))
        .filter((id): id is string => Boolean(id))
        .map((id) => ({ id }));

      if (row.existing) {
        await tx.faculty.update({
          where: { email: row.email },
          data: {
            fullName: row.fullName,
            designation: row.designation,
            capacity: row.capacity,
            phone: row.phone,
            employeeId: row.employeeId,
            // `set` replaces the mapping, so removing a domain in the sheet
            // removes it here too.
            domains: { set: connect },
          },
        });
        updated += 1;
      } else {
        await tx.faculty.create({
          data: {
            fullName: row.fullName,
            email: row.email,
            designation: row.designation,
            capacity: row.capacity,
            phone: row.phone,
            employeeId: row.employeeId,
            domains: { connect },
            user: {
              create: {
                email: row.email,
                passwordHash,
                role: "FACULTY",
                name: row.fullName,
              },
            },
          },
        });
        created += 1;
      }
    }

    const batch = await tx.importBatch.create({
      data: {
        cycleId: cycle.id,
        entity: "FACULTY",
        source: "CSV",
        totalRows: result.totalRows,
        successRows: result.valid.length,
        failedRows: result.issues.length,
        errors: result.issues.slice(0, 200),
        appliedById: auth.session.userId,
      },
    });

    return { batchId: batch.id, created, updated };
  });

  return NextResponse.json({
    applied: true,
    totalRows: result.totalRows,
    validCount: result.valid.length,
    errorCount: result.issues.length,
    ...summary,
    issues: result.issues.slice(0, 50),
  });
}
