import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDryRun } from "@/server/services/mailer";

/**
 * Unauthenticated liveness probe. Reports whether the database answers and
 * which mail mode is active; it deliberately exposes nothing else.
 */
export async function GET() {
  let database = "down";
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "up";
  } catch {
    database = "down";
  }

  return NextResponse.json(
    {
      ok: database === "up",
      database,
      mail: isDryRun() ? "DRY_RUN" : "LIVE",
      time: new Date().toISOString(),
    },
    { status: database === "up" ? 200 : 503 },
  );
}
