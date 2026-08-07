import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApi } from "@/lib/rbac";
import { badRequest } from "@/server/http";
import { GroupError, setPreferences } from "@/server/services/groups";

const PreferencesSchema = z.object({
  /** Faculty ids in rank order, position 0 being preference 1. */
  facultyIds: z.array(z.string().min(1)),
});

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/groups/[id]/preferences">,
) {
  const auth = await requireApi(["STUDENT"]);
  if (!auth.ok) return auth.response;
  if (!auth.session.studentId) {
    return badRequest("This account is not linked to a student record.");
  }

  const parsed = PreferencesSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid request.");
  }

  const { id } = await ctx.params;
  try {
    const preferences = await setPreferences(
      auth.session.studentId,
      id,
      parsed.data.facultyIds,
    );
    return NextResponse.json({
      ok: true,
      preferences: preferences.map((pref) => ({
        rank: pref.rank,
        facultyId: pref.facultyId,
        facultyName: pref.faculty.fullName,
      })),
    });
  } catch (error) {
    if (error instanceof GroupError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
