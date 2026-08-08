import type { Metadata } from "next";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { NotificationsInbox } from "@/components/student/notifications-inbox";
import { getSelectedCycle } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const session = await requirePage(["STUDENT"]);
  const cycle = await getSelectedCycle();
  const studentId = session.studentId;

  if (!cycle || !studentId) {
    return (
      <>
        <PageHeader title="Notifications" role="Student" />
        <Card>
          <CardBody>
            <p className="text-ink-secondary text-sm">
              This account is not linked to a student record.
            </p>
          </CardBody>
        </Card>
      </>
    );
  }

  const notifications = await prisma.notification.findMany({
    where: { studentId, cycleId: cycle.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Live alerts from your coordinator and guide."
        cycleName={cycle.name}
        role="Student"
      />

      <NotificationsInbox
        serverTime={new Date().toISOString()}
        initial={notifications.map((row) => ({
          id: row.id,
          subject: row.subject,
          body: row.body,
          senderName: row.senderName,
          status: row.status,
          createdAt: row.createdAt.toISOString(),
        }))}
      />
    </>
  );
}
