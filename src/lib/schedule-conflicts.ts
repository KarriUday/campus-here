/**
 * Review-session conflict rules. Pure, so they unit-test without a database.
 *
 * Two sessions clash when they overlap in time and share either the guide or
 * the venue — one person cannot be in two rooms, and one room cannot hold two
 * reviews.
 */

export type ScheduledSlot = {
  id: string;
  groupCode: string;
  facultyId: string | null;
  venue: string;
  startsAt: Date;
  durationMinutes: number;
};

export type Conflict = {
  with: string;
  kind: "GUIDE" | "VENUE";
  detail: string;
};

const endOf = (slot: { startsAt: Date; durationMinutes: number }) =>
  slot.startsAt.getTime() + slot.durationMinutes * 60_000;

/** Half-open intervals: a session ending at 10:30 does not clash with 10:30. */
export function overlaps(a: ScheduledSlot, b: ScheduledSlot) {
  return a.startsAt.getTime() < endOf(b) && b.startsAt.getTime() < endOf(a);
}

/** Normalised so "Lab 3" and "lab  3" are recognised as the same room. */
function sameVenue(a: string, b: string) {
  const norm = (v: string) => v.trim().toLowerCase().replace(/\s+/g, " ");
  return norm(a) === norm(b) && norm(a).length > 0;
}

export function findConflicts(
  candidate: ScheduledSlot,
  existing: ScheduledSlot[],
): Conflict[] {
  const conflicts: Conflict[] = [];

  for (const slot of existing) {
    if (slot.id === candidate.id) continue;
    if (!overlaps(candidate, slot)) continue;

    if (
      candidate.facultyId &&
      slot.facultyId &&
      candidate.facultyId === slot.facultyId
    ) {
      conflicts.push({
        with: slot.groupCode,
        kind: "GUIDE",
        detail: `the same guide is already reviewing ${slot.groupCode} then`,
      });
    }

    if (sameVenue(candidate.venue, slot.venue)) {
      conflicts.push({
        with: slot.groupCode,
        kind: "VENUE",
        detail: `${slot.venue} is already booked for ${slot.groupCode} then`,
      });
    }
  }

  return conflicts;
}
