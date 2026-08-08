import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/rbac";
import { badRequest, resolveCycle } from "@/server/http";
import {
  CalendarError,
  extractPdfText,
  importCalendar,
  MAX_PDF_BYTES,
} from "@/server/services/calendar";

/** Latest import, its detected events and the text it was parsed from. */
export async function GET(request: Request) {
  const auth = await requireApi(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  const [latest, events] = await Promise.all([
    prisma.calendarImport.findFirst({
      where: { cycleId: cycle.id },
      orderBy: { createdAt: "desc" },
      include: { uploadedBy: { select: { name: true } } },
    }),
    prisma.calendarEvent.findMany({
      where: { cycleId: cycle.id },
      orderBy: { eventDate: "asc" },
      include: { _count: { select: { reminders: true } } },
    }),
  ]);

  return NextResponse.json({
    latest: latest
      ? {
          id: latest.id,
          filename: latest.filename,
          extractedChars: latest.extractedChars,
          detectedEvents: latest.detectedEvents,
          createdAt: latest.createdAt,
          uploadedBy: latest.uploadedBy.name,
          // Enough to debug detection without shipping a whole document.
          textPreview: latest.rawText.slice(0, 4000),
        }
      : null,
    events: events.map((event) => ({
      id: event.id,
      title: event.title,
      phase: event.phase,
      eventDate: event.eventDate.toISOString().slice(0, 10),
      confidence: event.confidence,
      sourceLine: event.sourceLine,
      reminderCount: event._count.reminders,
    })),
  });
}

/**
 * Upload a calendar PDF, or paste its text when the PDF is a scan with no
 * extractable text layer.
 */
export async function POST(request: Request) {
  const auth = await requireApi(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  const contentType = request.headers.get("content-type") ?? "";
  let rawText = "";
  let filename = "pasted-calendar.txt";
  let fileBytes: Uint8Array | undefined;
  let mimeType: string | undefined;

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      const pasted = form.get("text");

      if (file && typeof file !== "string") {
        if (file.size > MAX_PDF_BYTES) {
          return badRequest(
            `File is larger than ${MAX_PDF_BYTES / 1024 / 1024}MB.`,
          );
        }
        if (!file.name.toLowerCase().endsWith(".pdf")) {
          return badRequest("Please upload a .pdf file, or paste the text.");
        }
        filename = file.name;
        mimeType = file.type || "application/pdf";
        fileBytes = new Uint8Array(await file.arrayBuffer());
        rawText = await extractPdfText(fileBytes);
      }

      // Pasted text wins when supplied — it is the fallback for scanned PDFs.
      if (typeof pasted === "string" && pasted.trim()) {
        rawText = pasted.trim();
        if (!fileBytes) filename = "pasted-calendar.txt";
      }
    } else {
      const body = await request.json().catch(() => null);
      if (!body || typeof body.text !== "string" || !body.text.trim()) {
        return badRequest("Provide a PDF file or paste the calendar text.");
      }
      rawText = body.text.trim();
      if (typeof body.filename === "string") filename = body.filename;
    }

    if (!rawText.trim()) {
      return badRequest(
        "No text could be extracted. This is usually a scanned PDF — paste the calendar text instead.",
      );
    }

    const outcome = await importCalendar({
      cycleId: cycle.id,
      uploadedById: auth.session.userId,
      filename,
      rawText,
      fileBytes,
      mimeType,
    });

    return NextResponse.json({ ok: true, ...outcome });
  } catch (error) {
    if (error instanceof CalendarError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
