import { prisma } from "@/lib/prisma";
import { compareByUrgency, liveReminderStatus } from "@/lib/reminder-status";

export {
  compareByUrgency,
  liveReminderStatus,
  REMINDER_KIND_LABEL,
} from "@/lib/reminder-status";

/** Reminders for a cycle with their live status applied and sorted. */
export async function listRemindersForCycle(cycleId: string) {
  const reminders = await prisma.reminder.findMany({
    where: { cycleId },
    orderBy: { dueAt: "asc" },
    include: { event: { select: { phase: true, sourceLine: true } } },
  });

  const now = new Date();
  return reminders
    .map((reminder) => ({
      ...reminder,
      liveStatus: liveReminderStatus(reminder, now),
    }))
    .sort(compareByUrgency);
}
