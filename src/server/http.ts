import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CYCLE_COOKIE } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";

/** Uploaded CSVs are text; 5MB is far past any realistic departmental roster. */
export const MAX_CSV_BYTES = 5 * 1024 * 1024;

export function badRequest(message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status: 400 });
}

export function notFound(message = "Not found.") {
  return NextResponse.json({ error: message }, { status: 404 });
}

/**
 * Resolve the cycle an API call operates on: an explicit `cycleId` or
 * `cycle` (code) parameter wins, otherwise the switcher cookie, otherwise the
 * active cycle. Never inferred from the request body.
 */
export async function resolveCycle(request: Request) {
  const url = new URL(request.url);
  const byId = url.searchParams.get("cycleId");
  const byCode = url.searchParams.get("cycle");

  if (byId) {
    return prisma.projectCycle.findUnique({ where: { id: byId } });
  }
  if (byCode) {
    return prisma.projectCycle.findUnique({ where: { code: byCode } });
  }

  const cookieCode = (await cookies()).get(CYCLE_COOKIE)?.value;
  if (cookieCode) {
    const fromCookie = await prisma.projectCycle.findUnique({
      where: { code: cookieCode },
    });
    if (fromCookie) return fromCookie;
  }

  return (
    (await prisma.projectCycle.findFirst({ where: { isActive: true } })) ??
    (await prisma.projectCycle.findFirst({ orderBy: { code: "asc" } }))
  );
}

export type UploadedCsv = {
  text: string;
  filename: string;
  size: number;
  /** False means "validate and show me a preview"; true means "write it". */
  apply: boolean;
};

/**
 * Read a CSV from either a multipart upload (`file`) or a JSON/form `text`
 * field, so an admin can paste a list as well as upload a spreadsheet.
 */
export async function readUploadedCsv(
  request: Request,
): Promise<UploadedCsv | { error: NextResponse }> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const apply = form.get("apply") === "true";
    const file = form.get("file");

    if (file && typeof file !== "string") {
      if (file.size > MAX_CSV_BYTES) {
        return {
          error: badRequest(
            `File is larger than ${Math.round(MAX_CSV_BYTES / 1024 / 1024)}MB.`,
          ),
        };
      }
      const name = file.name ?? "upload.csv";
      if (!name.toLowerCase().endsWith(".csv") && !name.toLowerCase().endsWith(".txt")) {
        return { error: badRequest("Please upload a .csv or .txt file.") };
      }
      return {
        text: await file.text(),
        filename: name,
        size: file.size,
        apply,
      };
    }

    const pasted = form.get("text");
    if (typeof pasted === "string" && pasted.trim()) {
      return {
        text: pasted,
        filename: "pasted.csv",
        size: pasted.length,
        apply,
      };
    }
    return { error: badRequest("No file or pasted text was provided.") };
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.text !== "string" || !body.text.trim()) {
    return { error: badRequest("No file or pasted text was provided.") };
  }
  if (body.text.length > MAX_CSV_BYTES) {
    return { error: badRequest("Pasted text is too large.") };
  }
  return {
    text: body.text,
    filename: typeof body.filename === "string" ? body.filename : "pasted.csv",
    size: body.text.length,
    apply: body.apply === true,
  };
}

/**
 * Password given to accounts created by a bulk import. Documented in the
 * README as something to change; students are expected to reset it.
 */
export function defaultImportPassword() {
  return process.env.DEFAULT_IMPORT_PASSWORD ?? process.env.SEED_PASSWORD ?? "Campus@123";
}
