import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/rbac";
import { badRequest, resolveCycle } from "@/server/http";
import {
  buildReport,
  REPORT_TYPES,
  ReportError,
  toWorkbook,
  type ReportScope,
  type ReportType,
} from "@/server/services/reports";

/**
 * `GET /api/reports/export?type=…&scope=…&cycleId=…&sessionId=…`
 *
 * Scope is derived from the session, not trusted from the query: a faculty
 * caller is forced to `faculty` regardless of what they ask for, so requesting
 * `scope=admin` cannot widen their view.
 */
export async function GET(request: Request) {
  const auth = await requireApi(["ADMIN", "FACULTY"]);
  if (!auth.ok) return auth.response;

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  const url = new URL(request.url);
  const type = url.searchParams.get("type") as ReportType | null;
  if (!type || !REPORT_TYPES.includes(type)) {
    return badRequest(
      `Unknown report type. Expected one of: ${REPORT_TYPES.join(", ")}.`,
    );
  }

  const scope: ReportScope = auth.session.role === "FACULTY" ? "faculty" : "admin";
  if (scope === "faculty" && !auth.session.facultyId) {
    return badRequest("This account is not linked to a faculty record.");
  }

  try {
    const sheet = await buildReport({
      type,
      cycleId: cycle.id,
      cycleName: cycle.name,
      scope,
      facultyId: auth.session.facultyId ?? null,
      sessionId: url.searchParams.get("sessionId"),
    });

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: auth.session.userId },
      select: { name: true },
    });

    const buffer = await toWorkbook(sheet, {
      cycleName: cycle.name,
      scope,
      generatedBy: user.name,
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${sheet.filename}.xlsx"`,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof ReportError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
