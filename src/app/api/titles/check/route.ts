import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApi } from "@/lib/rbac";
import { badRequest, resolveCycle } from "@/server/http";
import { checkTitle } from "@/server/services/similarity";
import { loadCorpusIndex } from "@/server/services/titles";

const CheckSchema = z.object({
  title: z.string().min(1, "Enter a title to check.").max(300),
  excludeTitleId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
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
  } catch (err: any) {
    console.error("Originality check error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error checking title." },
      { status: 500 },
    );
  }
}
