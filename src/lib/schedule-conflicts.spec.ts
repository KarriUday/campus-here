import { describe, expect, it } from "vitest";
import { findConflicts, overlaps, type ScheduledSlot } from "./schedule-conflicts";

const slot = (
  id: string,
  startsAt: string,
  overrides: Partial<ScheduledSlot> = {},
): ScheduledSlot => ({
  id,
  groupCode: `G-${id}`,
  facultyId: "f1",
  venue: "Seminar Hall 2",
  startsAt: new Date(startsAt),
  durationMinutes: 30,
  ...overrides,
});

describe("overlaps", () => {
  it("detects an overlap", () => {
    expect(
      overlaps(slot("a", "2026-09-12T10:00:00Z"), slot("b", "2026-09-12T10:15:00Z")),
    ).toBe(true);
  });

  it("treats back-to-back sessions as clear", () => {
    // 10:00-10:30 then 10:30-11:00 is a clean handover, not a clash.
    expect(
      overlaps(slot("a", "2026-09-12T10:00:00Z"), slot("b", "2026-09-12T10:30:00Z")),
    ).toBe(false);
  });

  it("ignores sessions on different days", () => {
    expect(
      overlaps(slot("a", "2026-09-12T10:00:00Z"), slot("b", "2026-09-13T10:00:00Z")),
    ).toBe(false);
  });
});

describe("findConflicts", () => {
  it("flags the same guide double-booked", () => {
    const existing = [slot("a", "2026-09-12T10:00:00Z", { venue: "Lab 3" })];
    const conflicts = findConflicts(
      slot("b", "2026-09-12T10:10:00Z", { venue: "Seminar Hall 2" }),
      existing,
    );
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].kind).toBe("GUIDE");
  });

  it("flags the same venue double-booked", () => {
    const existing = [slot("a", "2026-09-12T10:00:00Z", { facultyId: "f9" })];
    const conflicts = findConflicts(
      slot("b", "2026-09-12T10:10:00Z", { facultyId: "f1" }),
      existing,
    );
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].kind).toBe("VENUE");
  });

  it("reports both when guide and venue clash", () => {
    const existing = [slot("a", "2026-09-12T10:00:00Z")];
    const conflicts = findConflicts(slot("b", "2026-09-12T10:10:00Z"), existing);
    expect(conflicts.map((c) => c.kind).sort()).toEqual(["GUIDE", "VENUE"]);
  });

  it("normalises venue spelling before comparing", () => {
    const existing = [slot("a", "2026-09-12T10:00:00Z", { venue: "lab  3", facultyId: "f9" })];
    const conflicts = findConflicts(
      slot("b", "2026-09-12T10:10:00Z", { venue: "Lab 3", facultyId: "f1" }),
      existing,
    );
    expect(conflicts[0].kind).toBe("VENUE");
  });

  it("does not clash with itself when rescheduling", () => {
    const existing = [slot("a", "2026-09-12T10:00:00Z")];
    expect(findConflicts(slot("a", "2026-09-12T10:05:00Z"), existing)).toEqual([]);
  });

  it("allows two guides in different rooms at the same time", () => {
    const existing = [slot("a", "2026-09-12T10:00:00Z", { facultyId: "f9", venue: "Lab 3" })];
    expect(
      findConflicts(
        slot("b", "2026-09-12T10:00:00Z", { facultyId: "f1", venue: "Seminar Hall 2" }),
        existing,
      ),
    ).toEqual([]);
  });

  it("ignores an unassigned guide on both sides", () => {
    const existing = [slot("a", "2026-09-12T10:00:00Z", { facultyId: null, venue: "Lab 3" })];
    expect(
      findConflicts(
        slot("b", "2026-09-12T10:10:00Z", { facultyId: null, venue: "Seminar Hall 2" }),
        existing,
      ),
    ).toEqual([]);
  });
});
