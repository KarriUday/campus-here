import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApi } from "@/lib/rbac";
import { badRequest, resolveCycle } from "@/server/http";
import { checkTitle } from "@/server/services/similarity";
import { loadCorpusIndex } from "@/server/services/titles";

const CheckSchema = z.object({
  title: z.string().min(1, "Enter a title to check.").max(300),
  /** Skip a specific stored row — used when re-checking an existing title. */
  excludeTitleId: z.string().optional(),
});

/**
 * Live originality check. Called from the student's problem-statement screen
 * as they type, and by the admin title registry.
 *
 * This endpoint is advisory: it never writes. POST /api/titles re-runs the
 * same check server-side before saving, so a client that ignores a block here
 * still cannot register a duplicate.
 */
export async function POST(request: Request) {
  const auth = await requireApi(["ADMIN", "FACULTY", "STUDENT"]);
  if (!auth.ok) return auth.response;

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  const parsed = CheckSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid request.");
  }

  const index = await loadCorpusIndex(cycle.id);
  const report = checkTitle(parsed.data.title, index, {
    excludeId: parsed.data.excludeTitleId,
  });

  return NextResponse.json({ report });
}
