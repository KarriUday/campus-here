import { NextResponse } from "next/server";
import { requireApi } from "@/lib/rbac";
import { badRequest, resolveCycle } from "@/server/http";
import { createGroup, findMyGroup, GroupError } from "@/server/services/groups";

/** The signed-in student's group for the selected cycle, or null. */
export async function GET(request: Request) {
  const auth = await requireApi(["STUDENT"]);
  if (!auth.ok) return auth.response;
  if (!auth.session.studentId) {
    return badRequest("This account is not linked to a student record.");
  }

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  const group = await findMyGroup(auth.session.studentId, cycle.id);
  return NextResponse.json({ group });
}

export async function POST(request: Request) {
  const auth = await requireApi(["STUDENT"]);
  if (!auth.ok) return auth.response;
  if (!auth.session.studentId) {
    return badRequest("This account is not linked to a student record.");
  }

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  try {
    const group = await createGroup(auth.session.studentId, cycle.id);
    return NextResponse.json({ ok: true, group });
  } catch (error) {
    if (error instanceof GroupError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
