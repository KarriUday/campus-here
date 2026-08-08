import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApi } from "@/lib/rbac";
import { badRequest, resolveCycle } from "@/server/http";
import {
  AllocationError,
  previewAllocation,
  runAllocation,
} from "@/server/services/allocation";

const RunSchema = z.object({
  /** true computes and returns the matching without writing anything. */
  dryRun: z.boolean().default(true),
});

export async function POST(request: Request) {
  const auth = await requireApi(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  const parsed = RunSchema.safeParse((await request.json().catch(() => null)) ?? {});
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid request.");
  }

  try {
    if (parsed.data.dryRun) {
      const preview = await previewAllocation(cycle.id);
      return NextResponse.json({ dryRun: true, ...preview });
    }

    const { run, outcome, stable } = await runAllocation(
      cycle.id,
      auth.session.userId,
    );
    return NextResponse.json({
      dryRun: false,
      stable,
      runId: run.id,
      finishedAt: run.finishedAt,
      stats: outcome.stats,
    });
  } catch (error) {
    if (error instanceof AllocationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
