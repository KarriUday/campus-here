/**
 * Academic-calendar text parsing.
 *
 * A faithful port of the prototype's detector — `parseFlexibleDate`,
 * `guessReviewPhase`, `looksLikeReviewLine` and the three-pass
 * `extractReviewEventsFromText` — moved server-side and made pure, so it
 * unit-tests without a PDF or a database.
 *
 * One deliberate fix: the prototype's UI painted a green pill for
 * `confidence === "high"`, but no code path ever produced "high", so the pill
 * was unreachable. A line-level hit with an explicit phase marker is the most
 * reliable signal available, so it now earns HIGH.
 */

export type CalendarPhase = "R0" | "P1" | "P2" | "REVIEW";
export type DetectionConfidence = "HIGH" | "MEDIUM" | "LOW";

export type DetectedEvent = {
  title: string;
  phase: CalendarPhase;
  /** Local calendar day, normalised to YYYY-MM-DD. */
  eventDate: string;
  confidence: DetectionConfidence;
  sourceLine: string;
};

const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

/** Build a Date only if the components describe a real calendar day. */
function makeDate(year: number, month: number, day: number): Date | null {
  const date = new Date(year, month, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null; // rejects 31 February and friends
  }
  return date;
}

export function localDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Six accepted date shapes, tried in the prototype's order. A range such as
 * "04-05 October" yields its first day.
 */
export function parseFlexibleDate(
  input: string,
  fallbackYear = new Date().getFullYear(),
): Date | null {
  const text = input.trim();

  // "04-05 October 2026" — a range; take the first day.
  const range = text.match(
    /\b(\d{1,2})\s*[-–—]\s*(\d{1,2})\s+([A-Za-z]{3,9})(?:\s+(\d{4}))?\b/,
  );
  if (range) {
    const month = MONTHS[range[3].toLowerCase()];
    if (month !== undefined) {
      const date = makeDate(
        range[4] ? Number(range[4]) : fallbackYear,
        month,
        Number(range[1]),
      );
      if (date) return date;
    }
  }

  // "12 September 2026"
  const dayMonth = text.match(/\b(\d{1,2})\s+([A-Za-z]{3,9})(?:\s+(\d{4}))?\b/);
  if (dayMonth) {
    const month = MONTHS[dayMonth[2].toLowerCase()];
    if (month !== undefined) {
      const date = makeDate(
        dayMonth[3] ? Number(dayMonth[3]) : fallbackYear,
        month,
        Number(dayMonth[1]),
      );
      if (date) return date;
    }
  }

  // "12/09/2026" or "12-09-2026" — day first, as used in Indian calendars.
  const numeric = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/);
  if (numeric) {
    const date = makeDate(
      Number(numeric[3]),
      Number(numeric[2]) - 1,
      Number(numeric[1]),
    );
    if (date) return date;
  }

  // "2026-09-12"
  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) {
    const date = makeDate(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    if (date) return date;
  }

  // "September 12, 2026"
  const monthFirst = text.match(/\b([A-Za-z]{3,9})\s+(\d{1,2}),\s*(\d{4})\b/);
  if (monthFirst) {
    const month = MONTHS[monthFirst[1].toLowerCase()];
    if (month !== undefined) {
      const date = makeDate(
        Number(monthFirst[3]),
        month,
        Number(monthFirst[2]),
      );
      if (date) return date;
    }
  }

  return null;
}

/**
 * The trailing \b on each digit matters. The prototype used `review[-\s]*0`,
 * which happily matched the "0" inside "review - 04-05 October", so a Phase-1
 * line was misread as R0 and every phase shifted by one. Requiring the digit
 * to end on a word boundary keeps a date's leading zero out of it.
 */
const R0_RE = /\br0\b|\breview[-–—\s:]*0\b|\bproblem\s*statement\b/i;
const P1_RE = /\bp1\b|\bphase[-–—\s:]*1\b|\breview[-–—\s:]*1\b/i;
const P2_RE = /\bp2\b|\bphase[-–—\s:]*2\b|\breview[-–—\s:]*2\b/i;
export function guessReviewPhase(text: string): CalendarPhase {
  if (R0_RE.test(text)) return "R0";
  if (P1_RE.test(text)) return "P1";
  if (P2_RE.test(text)) return "P2";
  return "REVIEW";
}

/** True when a line plausibly describes a project review milestone. */
export function looksLikeReviewLine(line: string): boolean {
  return (
    /\breview\b/i.test(line) ||
    /\bmajor\b/i.test(line) ||
    /\bviva\b/i.test(line) ||
    /\bpresentation\b/i.test(line) ||
    /\bexhibition\b/i.test(line) ||
    /\br0\b/i.test(line) ||
    /\bp1\b/i.test(line) ||
    /\bp2\b/i.test(line)
  );
}

/** An explicit phase marker makes a detection trustworthy. */
function hasExplicitPhase(line: string) {
  return R0_RE.test(line) || P1_RE.test(line) || P2_RE.test(line);
}

function titleFor(phase: CalendarPhase) {
  return phase === "REVIEW" ? "Major project review" : `${phase} review`;
}

/**
 * Three passes, matching the prototype:
 *   1. line by line — the reliable case
 *   2. one whole-blob regex, for calendars that extract as a single line
 *   3. sentence-ish chunks, only when the first two found nothing
 */
export function extractReviewEvents(
  rawText: string,
  fallbackYear = new Date().getFullYear(),
): DetectedEvent[] {
  const events: DetectedEvent[] = [];
  const seen = new Set<string>();

  const push = (line: string, date: Date, confidence: DetectionConfidence) => {
    const phase = guessReviewPhase(line);
    const key = `${localDateKey(date)}|${phase}`;
    if (seen.has(key)) return;
    seen.add(key);
    events.push({
      title: titleFor(phase),
      phase,
      eventDate: localDateKey(date),
      confidence,
      sourceLine: line.trim().slice(0, 300),
    });
  };

  // Pass 1 — line by line.
  for (const line of rawText.split(/\r?\n+/)) {
    const trimmed = line.trim();
    if (!trimmed || !looksLikeReviewLine(trimmed)) continue;
    const date = parseFlexibleDate(trimmed, fallbackYear);
    if (date) {
      push(trimmed, date, hasExplicitPhase(trimmed) ? "HIGH" : "MEDIUM");
    }
  }

  // Pass 2 — the whole blob, for single-line extractions.
  const flat = rawText.replace(/\s+/g, " ");
  const blobRe =
    /(major\s+project\s+review(?:\s*[-–—:]?\s*\d+)?|review(?:\s*[-–—:]?\s*\d+)?|phase\s*[-–—:]?\s*\d|\br0\b|\bp1\b|\bp2\b)([^0-9]{0,60})((\d{1,2})\s*[-–—]\s*(\d{1,2})\s+([A-Za-z]{3,9})(?:\s+(\d{4}))?|(\d{1,2})\s+([A-Za-z]{3,9})(?:\s+(\d{4}))?|(\d{1,2})[/-](\d{1,2})[/-](\d{4}))/gi;

  for (const match of flat.matchAll(blobRe)) {
    const fragment = match[0];
    if (!looksLikeReviewLine(fragment)) continue;
    const date = parseFlexibleDate(match[3], fallbackYear);
    if (date) push(fragment, date, "MEDIUM");
  }

  // Pass 3 — only if nothing at all was found.
  if (events.length === 0) {
    for (const chunk of rawText.split(/(?<=[.\n;])/g)) {
      const trimmed = chunk.trim();
      if (!trimmed || !looksLikeReviewLine(trimmed)) continue;
      const date = parseFlexibleDate(trimmed, fallbackYear);
      if (date) push(trimmed, date, "LOW");
    }
  }

  return events.sort((a, b) => a.eventDate.localeCompare(b.eventDate));
}

/**
 * 09:00 local on (eventDate − offsetDays). Both the 15-day and 7-day windows
 * spec §3.6 requires are generated from this; the prototype only ever made
 * the 7-day one.
 */
export function reminderDueAt(eventDate: Date, offsetDays: number): Date {
  const due = new Date(eventDate.getTime());
  due.setDate(due.getDate() - offsetDays);
  due.setHours(9, 0, 0, 0);
  return due;
}

export const REMINDER_OFFSETS = [
  { kind: "REVIEW_15_DAY" as const, days: 15 },
  { kind: "REVIEW_7_DAY" as const, days: 7 },
];

/** The reminder body the prototype composed, including its source snippet. */
export function reminderBody(event: {
  title: string;
  phase: string;
  eventDate: string;
  sourceLine: string;
}) {
  return (
    `This is a reminder that your major project review is scheduled.\n\n` +
    `Event: ${event.title}\n` +
    `Phase: ${event.phase}\n` +
    `Date: ${event.eventDate}\n\n` +
    `Source snippet:\n${event.sourceLine}\n`
  );
}
