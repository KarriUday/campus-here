import { extractText, getDocumentProxy } from "unpdf";
import { prisma } from "@/lib/prisma";
import {
  extractReviewEvents,
  reminderBody,
  reminderDueAt,
  REMINDER_OFFSETS,
  type DetectedEvent,
} from "@/lib/calendar-parse";

/**
 * Calendar ingestion.
 *
 * The prototype ran pdf.js in the browser and kept the extracted text in a
 * closure variable, losing it on every re-render. Here extraction happens
 * server-side via `unpdf` (a serverless-safe pdf.js build) and the raw text is
 * persisted, so the "extracted text" panel survives a reload and the detector
 * can be re-run without re-uploading.
 */

export class CalendarError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "CalendarError";
  }
}

/** Vercel has no writable filesystem, so bytes go to Postgres. */
export const MAX_PDF_BYTES = 10 * 1024 * 1024;

export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  try {
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    return (Array.isArray(text) ? text.join("\n\n") : text)
      .replace(/[ \t\f\v]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  } catch (error) {
    throw new CalendarError(
      `Could not read that PDF: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export type ImportOutcome = {
  importId: string;
  filename: string;
  extractedChars: number;
  events: DetectedEvent[];
  /** True when the PDF yielded no usable text — usually a scanned document. */
  needsManualText: boolean;
};

export async function importCalendar(options: {
  cycleId: string;
  uploadedById: string;
  filename: string;
  rawText: string;
  fileBytes?: Uint8Array;
  mimeType?: string;
}): Promise<ImportOutcome> {
  const { cycleId, uploadedById, filename, rawText } = options;
  const events = extractReviewEvents(rawText);

  const outcome = await prisma.$transaction(async (tx) => {
    let fileId: string | undefined;
    if (options.fileBytes) {
      const file = await tx.uploadedFile.create({
        data: {
          filename,
          mimeType: options.mimeType ?? "application/pdf",
          size: options.fileBytes.byteLength,
          bytes: Buffer.from(options.fileBytes),
          kind: "CALENDAR_PDF",
          uploadedById,
        },
      });
      fileId = file.id;
    }

    const created = await tx.calendarImport.create({
      data: {
        cycleId,
        fileId,
        filename,
        extractedChars: rawText.length,
        detectedEvents: events.length,
        rawText,
        uploadedById,
      },
    });

    if (events.length > 0) {
      await tx.calendarEvent.createMany({
        data: events.map((event) => ({
          cycleId,
          importId: created.id,
          title: event.title,
          phase: event.phase,
          eventDate: new Date(`${event.eventDate}T00:00:00.000Z`),
          confidence: event.confidence,
          sourceLine: event.sourceLine,
        })),
      });
    }

    return created;
  });

  return {
    importId: outcome.id,
    filename,
    extractedChars: rawText.length,
    events,
    needsManualText: rawText.trim().length < 40,
  };
}

/**
 * Create the 15-day and 7-day reminders for every detected event in a cycle.
 *
 * Spec §3.6 and the Reviews screen both promise both windows; the prototype
 * only ever generated the 7-day one. Regenerating replaces reminders that have
 * not been sent, so an admin can re-run it safely without duplicating or
 * resurrecting anything already dispatched.
 */
export async function generateReminders(cycleId: string) {
  const events = await prisma.calendarEvent.findMany({
    where: { cycleId },
    orderBy: { eventDate: "asc" },
  });
  if (events.length === 0) {
    throw new CalendarError(
      "No review dates detected yet. Upload a calendar PDF first.",
    );
  }

  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const removed = await tx.reminder.deleteMany({
      where: { cycleId, status: { in: ["QUEUED", "DUE"] } },
    });

    const rows: Array<{
      cycleId: string;
      eventId: string;
      kind: (typeof REMINDER_OFFSETS)[number]["kind"];
      title: string;
      body: string;
      eventDate: Date;
      dueAt: Date;
      status: "QUEUED" | "DUE";
    }> = [];

    for (const event of events) {
      const dateKey = event.eventDate.toISOString().slice(0, 10);
      for (const { kind, days } of REMINDER_OFFSETS) {
        const dueAt = reminderDueAt(event.eventDate, days);
        rows.push({
          cycleId,
          eventId: event.id,
          kind,
          title: `Reminder: ${event.title} on ${dateKey}`,
          body: reminderBody({
            title: event.title,
            phase: event.phase,
            eventDate: dateKey,
            sourceLine: event.sourceLine,
          }),
          eventDate: event.eventDate,
          dueAt,
          // Seeded correctly so the dashboards read right before the first
          // cron tick; the live status is recomputed on every read anyway.
          status: dueAt.getTime() <= now.getTime() ? "DUE" : "QUEUED",
        });
      }
    }

    // A reminder already sent for an event+kind must not be recreated.
    const alreadySent = await tx.reminder.findMany({
      where: { cycleId, status: { in: ["SENT", "FAILED"] } },
      select: { eventId: true, kind: true },
    });
    const sentKeys = new Set(
      alreadySent.map((row) => `${row.eventId}|${row.kind}`),
    );
    const fresh = rows.filter(
      (row) => !sentKeys.has(`${row.eventId}|${row.kind}`),
    );

    const created = await tx.reminder.createMany({ data: fresh });
    return {
      replaced: removed.count,
      created: created.count,
      skippedAlreadySent: rows.length - fresh.length,
      events: events.length,
    };
  });
}
