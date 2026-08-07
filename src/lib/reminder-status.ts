import type { ReminderKind, ReminderStatus } from "@/generated/prisma/enums";

/**
 * Pure reminder rules — deliberately free of any database import so they can
 * be unit-tested without a connection, and reused by both the UI and the cron
 * dispatcher.
 */

/**
 * Status is stored, but recomputed on read against the wall clock so a
 * reminder reads as due the moment its time passes rather than waiting for the
 * nightly cron. This mirrors the prototype's `refreshReminderStatuses`.
 *
 * SENT and FAILED are terminal: a dispatched reminder must never flip back.
 */
export function liveReminderStatus(
  reminder: { status: ReminderStatus; dueAt: Date },
  now: Date = new Date(),
): ReminderStatus {
  if (reminder.status === "SENT" || reminder.status === "FAILED") {
    return reminder.status;
  }
  return reminder.dueAt.getTime() <= now.getTime() ? "DUE" : "QUEUED";
}

/** DUE first, then QUEUED, then anything terminal; each by due time. */
export function compareByUrgency(
  a: { liveStatus: ReminderStatus; dueAt: Date },
  b: { liveStatus: ReminderStatus; dueAt: Date },
) {
  const rank = (status: ReminderStatus) =>
    status === "DUE" ? 0 : status === "QUEUED" ? 1 : 2;
  return (
    rank(a.liveStatus) - rank(b.liveStatus) ||
    a.dueAt.getTime() - b.dueAt.getTime()
  );
}

export const REMINDER_KIND_LABEL: Record<ReminderKind, string> = {
  REVIEW_15_DAY: "15 days before",
  REVIEW_7_DAY: "7 days before",
};
