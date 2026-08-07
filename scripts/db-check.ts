/**
 * Connectivity smoke check.
 *
 * Exercises the real runtime path — src/lib/prisma.ts and the pg driver
 * adapter — rather than the Prisma CLI, so a working `migrate` cannot mask a
 * broken application connection.
 *
 *   npm run db:check
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const [{ version }] = await prisma.$queryRaw<
    Array<{ version: string }>
  >`SELECT version()`;
  console.log(`connected: ${version.split(",")[0]}`);

  const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;
  console.log(`tables (${tables.length}): ${tables.map((t) => t.table_name).join(", ")}`);

  const counts = {
    users: await prisma.user.count(),
    cycles: await prisma.projectCycle.count(),
    students: await prisma.student.count(),
    faculty: await prisma.faculty.count(),
    groups: await prisma.group.count(),
    titles: await prisma.projectTitle.count(),
  };
  console.log("row counts:", counts);
}

main()
  .catch((error) => {
    console.error("db-check failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
