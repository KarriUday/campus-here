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
import {
  validateStudentRows,
  type ExistingStudentIndex,
} from "@/server/services/csv";

/**
 * Two-step ingestion: the client posts the same file twice, first with
 * `apply=false` for a preview and then with `apply=true` to commit. The file
 * is re-parsed and re-validated on the second call, so nothing the browser
 * sends back is trusted.
 */
export async function POST(request: Request) {
  const auth = await requireApi(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  const upload = await readUploadedCsv(request);
  if ("error" in upload) return upload.error;

  // Build the duplicate index the validator checks against.
  const [enrolled, allStudents] = await Promise.all([
    prisma.studentCycle.findMany({
      where: { cycleId: cycle.id },
      select: { student: { select: { usn: true } } },
    }),
    prisma.student.findMany({ select: { usn: true, email: true } }),
  ]);

  const index: ExistingStudentIndex = {
    enrolledUsns: new Set(enrolled.map((e) => e.student.usn)),
    knownUsns: new Set(allStudents.map((s) => s.usn)),
    emailOwners: new Map(allStudents.map((s) => [s.email, s.usn])),
  };

  const result = validateStudentRows(upload.text, index);

  if (!upload.apply) {
    return NextResponse.json({
      applied: false,
      cycle: { id: cycle.id, name: cycle.name },
      totalRows: result.totalRows,
      validCount: result.valid.length,
      errorCount: result.issues.length,
      // Enough rows to inspect without shipping a whole roster back.
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
  const toCreate = result.valid.filter((row) => !row.existing);
  const toEnrolOnly = result.valid.filter((row) => row.existing);

  const summary = await prisma.$transaction(async (tx) => {
    if (toCreate.length > 0) {
      // Bulk inserts rather than one round trip per student: a 300-row roster
      // would otherwise be 900 sequential statements.
      await tx.user.createMany({
        data: toCreate.map((row) => ({
          email: row.email,
          passwordHash,
          role: "STUDENT" as const,
          name: row.fullName,
        })),
        skipDuplicates: true,
      });

      const users = await tx.user.findMany({
        where: { email: { in: toCreate.map((row) => row.email) } },
        select: { id: true, email: true },
      });
      const userIdByEmail = new Map(users.map((u) => [u.email, u.id]));

      await tx.student.createMany({
        data: toCreate
          .filter((row) => userIdByEmail.has(row.email))
          .map((row) => ({
            userId: userIdByEmail.get(row.email)!,
            usn: row.usn,
            fullName: row.fullName,
            email: row.email,
            cgpa: row.cgpa,
            phone: row.phone,
          })),
        skipDuplicates: true,
      });
    }

    const students = await tx.student.findMany({
      where: { usn: { in: result.valid.map((row) => row.usn) } },
      select: { id: true, usn: true },
    });

    await tx.studentCycle.createMany({
      data: students.map((student) => ({
        studentId: student.id,
        cycleId: cycle.id,
      })),
      skipDuplicates: true,
    });

    const batch = await tx.importBatch.create({
      data: {
        cycleId: cycle.id,
        entity: "STUDENTS",
        source: "CSV",
        totalRows: result.totalRows,
        successRows: result.valid.length,
        failedRows: result.issues.length,
        errors: result.issues.slice(0, 200),
        appliedById: auth.session.userId,
      },
    });

    return {
      batchId: batch.id,
      created: toCreate.length,
      enrolled: toEnrolOnly.length,
      total: students.length,
    };
  });

  return NextResponse.json({
    applied: true,
    cycle: { id: cycle.id, name: cycle.name },
    totalRows: result.totalRows,
    validCount: result.valid.length,
    errorCount: result.issues.length,
    ...summary,
    issues: result.issues.slice(0, 50),
  });
}
