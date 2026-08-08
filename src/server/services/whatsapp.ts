import twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { toWhatsAppAddress } from "@/lib/phone";

/**
 * Twilio WhatsApp.
 *
 * Dry-run is the default, exactly as with email: the attempt is logged and
 * persisted with mode=DRY_RUN and is never reported as delivered. The sandbox
 * sender is the documented default, so a Twilio trial account works unchanged.
 */

export class WhatsAppError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "WhatsAppError";
  }
}

export function isWhatsAppDryRun() {
  return process.env.WHATSAPP_DRY_RUN !== "false";
}

export function whatsAppFrom() {
  return process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886";
}

export function isWhatsAppConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN,
  );
}

export { toWhatsAppAddress } from "@/lib/phone";

export async function sendWhatsApp(options: {
  cycleId: string;
  sentById: string;
  numbers: string[];
  body: string;
  /** Appends the prototype's documents note when a mail with files went out. */
  documentsEmailed?: boolean;
}) {
  const body = options.documentsEmailed
    ? `${options.body.trim()}\n\nDocuments have been sent to your email.`
    : options.body.trim();

  if (!body) throw new WhatsAppError("A message body is required.");

  const addresses: string[] = [];
  const rejected: string[] = [];
  for (const raw of options.numbers) {
    const address = toWhatsAppAddress(raw);
    if (address) addresses.push(address);
    else if (raw.trim()) rejected.push(raw.trim());
  }
  if (addresses.length === 0) {
    throw new WhatsAppError(
      rejected.length > 0
        ? `No valid Indian mobile numbers. Rejected: ${rejected.slice(0, 5).join(", ")}.`
        : "No recipients with a phone number on file.",
    );
  }

  const dryRun = isWhatsAppDryRun() || !isWhatsAppConfigured();
  const client = dryRun
    ? null
    : twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);

  let delivered = 0;
  let failed = 0;

  for (const to of addresses) {
    let sid: string | undefined;
    let error: string | undefined;

    if (client) {
      try {
        const message = await client.messages.create({
          from: whatsAppFrom(),
          to,
          body,
        });
        sid = message.sid;
        delivered += 1;
      } catch (cause) {
        error = cause instanceof Error ? cause.message : String(cause);
        failed += 1;
      }
    } else {
      console.info(`[whatsapp:dry-run] to=${to} body="${body.slice(0, 80)}"`);
    }

    await prisma.whatsAppMessage.create({
      data: {
        cycleId: options.cycleId,
        toNumber: to,
        body,
        twilioSid: sid,
        status: sid ? "DELIVERED" : dryRun ? "DRY_RUN" : "FAILED",
        mode: dryRun ? "DRY_RUN" : "LIVE",
        error,
        sentById: options.sentById,
      },
    });
  }

  return {
    attempted: addresses.length,
    delivered,
    failed,
    rejected,
    mode: dryRun ? ("DRY_RUN" as const) : ("LIVE" as const),
    from: whatsAppFrom(),
  };
}
