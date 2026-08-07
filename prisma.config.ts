import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma CLI configuration (migrate, studio, seed).
 *
 * The CLI runs DDL, which pooled endpoints (Neon pooler, Supabase transaction
 * pooler) reject — so it uses DIRECT_URL when one is provided. The application
 * itself connects through the pooled DATABASE_URL via the pg driver adapter in
 * `src/lib/prisma.ts`.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
