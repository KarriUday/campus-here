import type { Metadata } from "next";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { MailCenter } from "@/components/comms/mail-center";
import { getSelectedCycle } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/rbac";
import { isDryRun } from "@/server/services/mailer";
import { facultySmtp } from "@/server/services/bulk-mail";
import { maskSecret } from "@/server/services/crypto";

export const metadata: Metadata = { title: "Mail Center" };

export default async function MailPage() {
  const session = await requirePage(["ADMIN"]);
  const cycle = await getSelectedCycle();

  if (!cycle) {
    return (
      <>
        <PageHeader title="Mail Center" role="Admin" />
        <Card>
          <CardBody>
            <p className="text-ink-secondary text-sm">No cycle selected.</p>
          </CardBody>
        </Card>
      </>
    );
  }

  const [own, history, personal] = await Promise.all([
    session.facultyId
      ? prisma.faculty.findUnique({
          where: { id: session.facultyId },
          select: { smtpUserEnc: true, smtpHost: true, smtpPort: true },
        })
      : Promise.resolve(null),
    prisma.emailMessage.findMany({
      where: {
        cycleId: cycle.id,
        ...(session.role === "FACULTY" ? { senderUserId: session.userId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    facultySmtp(session.facultyId),
  ]);

  const dryRun = isDryRun();

  return (
    <>
      <PageHeader
        title="Mail Center"
        subtitle="Email students across the cycle, delivered over SMTP with in-app notifications."
        cycleName={cycle.name}
        role="Admin"
      />

      <MailCenter
        role="ADMIN"
        cycleName={cycle.name}
        config={{
          dryRun,
          envConfigured: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
          personalConfigured: Boolean(own?.smtpUserEnc),
          personalUser: personal ? maskSecret(personal.user) : null,
          host: own?.smtpHost ?? process.env.SMTP_HOST ?? null,
          port: own?.smtpPort ?? Number(process.env.SMTP_PORT ?? 587),
          hint: dryRun
            ? "Dry-run mode: sends are recorded but nothing leaves this machine."
            : personal
              ? "Sending through your own SMTP credentials."
              : "Sending through the server's configured SMTP account.",
        }}
        history={history.map((message) => ({
          id: message.id,
          subject: message.subject,
          bodyPreview: message.body.slice(0, 160),
          senderName: message.senderName,
          recipientCount: message.recipientCount,
          delivered: message.delivered,
          failed: message.failed,
          mode: message.mode,
          smtpMode: message.smtpMode,
          createdAt: message.createdAt.toISOString(),
        }))}
      />
    </>
  );
}
