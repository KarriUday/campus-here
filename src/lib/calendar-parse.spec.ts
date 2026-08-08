import { describe, expect, it } from "vitest";
import {
  extractReviewEvents,
  guessReviewPhase,
  localDateKey,
  looksLikeReviewLine,
  parseFlexibleDate,
  reminderDueAt,
} from "./calendar-parse";

const key = (date: Date | null) => (date ? localDateKey(date) : null);

describe("parseFlexibleDate", () => {
  it("reads a day-month-year date", () => {
    expect(key(parseFlexibleDate("12 September 2026"))).toBe("2026-09-12");
    expect(key(parseFlexibleDate("5 Sept 2026"))).toBe("2026-09-05");
  });

  it("takes the first day of a range", () => {
    expect(key(parseFlexibleDate("04-05 October 2026"))).toBe("2026-10-04");
    expect(key(parseFlexibleDate("25–26 April 2026"))).toBe("2026-04-25");
  });

  it("reads day-first numeric dates", () => {
    expect(key(parseFlexibleDate("12/09/2026"))).toBe("2026-09-12");
    expect(key(parseFlexibleDate("01-11-2026"))).toBe("2026-11-01");
  });

  it("reads ISO and month-first dates", () => {
    expect(key(parseFlexibleDate("2026-09-12"))).toBe("2026-09-12");
    expect(key(parseFlexibleDate("September 12, 2026"))).toBe("2026-09-12");
  });

  it("falls back to the given year when none is written", () => {
    expect(key(parseFlexibleDate("12 September", 2027))).toBe("2027-09-12");
  });

  it("rejects impossible calendar days", () => {
    expect(parseFlexibleDate("31 February 2026")).toBeNull();
    expect(parseFlexibleDate("32/01/2026")).toBeNull();
  });

  it("returns null when there is no date at all", () => {
    expect(parseFlexibleDate("Major project review week")).toBeNull();
  });
});

describe("guessReviewPhase", () => {
  it("recognises each phase marker", () => {
    expect(guessReviewPhase("Major project review 0 (R0)")).toBe("R0");
    expect(guessReviewPhase("problem statement presentation")).toBe("R0");
    expect(guessReviewPhase("Major project phase-1 review")).toBe("P1");
    expect(guessReviewPhase("Review 2 for major project")).toBe("P2");
  });

  it("falls back to a generic review", () => {
    expect(guessReviewPhase("Project exhibition and viva")).toBe("REVIEW");
  });

  it("does not read a date's leading zero as the phase number", () => {
    // "review - 04-05 October" once matched R0's `review[-\s]*0`, shifting
    // every phase in the calendar by one.
    expect(guessReviewPhase("Major project phase-1 (P1) review - 04-05 October 2026")).toBe("P1");
    expect(guessReviewPhase("Major project phase-2 (P2) review - 18 November 2026")).toBe("P2");
    expect(guessReviewPhase("Project review - 05 December 2026")).toBe("REVIEW");
  });
});

describe("looksLikeReviewLine", () => {
  it("accepts review-ish lines and rejects unrelated ones", () => {
    expect(looksLikeReviewLine("Major project review 0")).toBe(true);
    expect(looksLikeReviewLine("Project exhibition and viva")).toBe(true);
    expect(looksLikeReviewLine("Last date for fee payment")).toBe(false);
  });
});

describe("extractReviewEvents", () => {
  const CALENDAR = [
    "BMS INSTITUTE OF TECHNOLOGY AND MANAGEMENT",
    "Academic Calendar 2026-27 (Odd Semester)",
    "",
    "Last date for fee payment - 01 August 2026",
    "Major project review 0 (R0) - problem statement presentation - 12 September 2026",
    "Major project phase-1 (P1) review - 04-05 October 2026",
    "Internal assessment week - 20 October 2026",
    "Major project phase-2 (P2) review - 18 November 2026",
    "Project exhibition and viva - 05 December 2026",
  ].join("\n");

  it("finds the review milestones and ignores unrelated dates", () => {
    const events = extractReviewEvents(CALENDAR);
    expect(events.map((e) => `${e.phase} ${e.eventDate}`)).toEqual([
      "R0 2026-09-12",
      "P1 2026-10-04",
      "P2 2026-11-18",
      "REVIEW 2026-12-05",
    ]);
    // The fee-payment and internal-assessment lines are not review lines.
    expect(events.some((e) => e.sourceLine.includes("fee payment"))).toBe(false);
    expect(events.some((e) => e.sourceLine.includes("Internal assessment"))).toBe(
      false,
    );
  });

  it("marks an explicit phase marker as HIGH confidence", () => {
    // The prototype rendered a green pill for "high" that no code path could
    // ever produce; a line-level hit with a phase marker now earns it.
    const events = extractReviewEvents(CALENDAR);
    expect(events.find((e) => e.phase === "R0")?.confidence).toBe("HIGH");
    expect(events.find((e) => e.phase === "REVIEW")?.confidence).toBe("MEDIUM");
  });

  it("keeps the source line for the reminder body", () => {
    const events = extractReviewEvents(CALENDAR);
    expect(events[0].sourceLine).toContain("problem statement presentation");
  });

  it("handles a calendar that extracts as one long line", () => {
    const flat =
      "Academic calendar. Major project review 0 - 12 September 2026. " +
      "Major project phase-2 review - 18 November 2026.";
    const events = extractReviewEvents(flat);
    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(events.map((e) => e.eventDate)).toContain("2026-09-12");
    expect(events.map((e) => e.eventDate)).toContain("2026-11-18");
  });

  it("deduplicates the same phase on the same day", () => {
    const repeated = [
      "Major project review 0 (R0) - 12 September 2026",
      "R0 review - 12 September 2026",
    ].join("\n");
    expect(extractReviewEvents(repeated)).toHaveLength(1);
  });

  it("returns nothing for a calendar with no review dates", () => {
    expect(
      extractReviewEvents("Fee payment 01 August 2026\nHoliday 15 August 2026"),
    ).toEqual([]);
  });

  it("returns nothing for empty input rather than throwing", () => {
    expect(extractReviewEvents("")).toEqual([]);
    expect(extractReviewEvents("   \n  \n")).toEqual([]);
  });

  it("sorts events by date", () => {
    const jumbled = [
      "Major project phase-2 (P2) review - 18 November 2026",
      "Major project review 0 (R0) - 12 September 2026",
    ].join("\n");
    expect(extractReviewEvents(jumbled).map((e) => e.eventDate)).toEqual([
      "2026-09-12",
      "2026-11-18",
    ]);
  });
});

describe("reminderDueAt", () => {
  it("lands on 09:00 local, the given number of days earlier", () => {
    const event = new Date(2026, 8, 20, 14, 30); // 20 Sept 2026, 14:30
    const fifteen = reminderDueAt(event, 15);
    const seven = reminderDueAt(event, 7);

    expect(localDateKey(fifteen)).toBe("2026-09-05");
    expect(localDateKey(seven)).toBe("2026-09-13");
    expect(fifteen.getHours()).toBe(9);
    expect(fifteen.getMinutes()).toBe(0);
    expect(seven.getHours()).toBe(9);
  });

  it("crosses a month boundary correctly", () => {
    expect(localDateKey(reminderDueAt(new Date(2026, 9, 5), 15))).toBe("2026-09-20");
  });

  it("does not mutate the event date", () => {
    const event = new Date(2026, 8, 20, 14, 30);
    reminderDueAt(event, 15);
    expect(event.getDate()).toBe(20);
    expect(event.getHours()).toBe(14);
  });
});
