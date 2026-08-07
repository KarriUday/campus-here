import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma 7 removed the bundled Rust query engine, so the client is constructed
 * around a driver adapter. `@prisma/adapter-pg` runs on the Node runtime, which
 * every route in this app already needs (nodemailer, twilio, SheetJS, pdf text
 * extraction), and it speaks to Neon's pooled endpoint and Supabase's
 * transaction pooler without further configuration.
 *
 * Migrations deliberately do NOT go through here — the CLI uses DIRECT_URL from
 * prisma.config.ts, because pooled endpoints reject DDL.
 */
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and fill it in.",
    );
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

/**
 * A single client instance per process. Next.js hot-reloads modules in
 * development, which would otherwise open a new pool on every edit until
 * Postgres refuses connections.
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
