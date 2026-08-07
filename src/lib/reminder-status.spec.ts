import { describe, expect, it } from "vitest";
import { compareByUrgency, liveReminderStatus } from "./reminder-status";

const at = (offsetMs: number) => new Date(Date.now() + offsetMs);
const HOUR = 3_600_000;

describe("liveReminderStatus", () => {
  it("is DUE once the reminder time has passed", () => {
    expect(liveReminderStatus({ status: "QUEUED", dueAt: at(-HOUR) })).toBe("DUE");
  });

  it("is QUEUED while the reminder time is still ahead", () => {
    expect(liveReminderStatus({ status: "QUEUED", dueAt: at(HOUR) })).toBe(
      "QUEUED",
    );
  });

  it("treats the exact due instant as DUE", () => {
    const now = new Date("2026-05-01T09:00:00Z");
    expect(liveReminderStatus({ status: "QUEUED", dueAt: now }, now)).toBe("DUE");
  });

  it("never un-sends a dispatched reminder", () => {
    // A SENT reminder whose dueAt is in the future must not revert to QUEUED.
    expect(liveReminderStatus({ status: "SENT", dueAt: at(HOUR) })).toBe("SENT");
    expect(liveReminderStatus({ status: "SENT", dueAt: at(-HOUR) })).toBe("SENT");
    expect(liveReminderStatus({ status: "FAILED", dueAt: at(-HOUR) })).toBe(
      "FAILED",
    );
  });

  it("recomputes a stale stored DUE back to QUEUED", () => {
    // Guards against a stored status left behind by a clock change.
    expect(liveReminderStatus({ status: "DUE", dueAt: at(HOUR) })).toBe("QUEUED");
  });
});

describe("compareByUrgency", () => {
  it("puts DUE first, then QUEUED, then terminal states", () => {
    const rows = [
      { liveStatus: "SENT" as const, dueAt: at(-3 * HOUR) },
      { liveStatus: "QUEUED" as const, dueAt: at(2 * HOUR) },
      { liveStatus: "DUE" as const, dueAt: at(-HOUR) },
    ];
    expect([...rows].sort(compareByUrgency).map((r) => r.liveStatus)).toEqual([
      "DUE",
      "QUEUED",
      "SENT",
    ]);
  });

  it("orders equal statuses by due time, earliest first", () => {
    const later = { liveStatus: "QUEUED" as const, dueAt: at(5 * HOUR) };
    const sooner = { liveStatus: "QUEUED" as const, dueAt: at(HOUR) };
    expect([later, sooner].sort(compareByUrgency)).toEqual([sooner, later]);
  });
});
