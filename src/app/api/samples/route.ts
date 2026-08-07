import { NextResponse } from "next/server";
import { requireApi } from "@/lib/rbac";
import {
  SAMPLE_FACULTY_CSV,
  SAMPLE_STUDENT_CSV,
  SAMPLE_TITLE_CSV,
} from "@/server/services/csv";

const SAMPLES: Record<string, { filename: string; body: string }> = {
  students: { filename: "students-sample.csv", body: SAMPLE_STUDENT_CSV },
  faculty: { filename: "faculty-sample.csv", body: SAMPLE_FACULTY_CSV },
  titles: { filename: "titles-sample.csv", body: SAMPLE_TITLE_CSV },
};

/** Download a correctly-shaped example of each import file. */
export async function GET(request: Request) {
  const auth = await requireApi(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const kind = new URL(request.url).searchParams.get("kind") ?? "students";
  const sample = SAMPLES[kind];
  if (!sample) {
    return NextResponse.json({ error: "Unknown sample." }, { status: 404 });
  }

  return new NextResponse(sample.body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${sample.filename}"`,
    },
  });
}
