import nodemailer, { type Transporter } from "nodemailer";

/**
 * SMTP transport.
 *
 * Dry-run is the default (`MAIL_DRY_RUN=true` in .env.example). In that mode a
 * send is logged and reported back as `mode: "DRY_RUN"` — it is never reported
 * as delivered. Callers persist that distinction, so the UI can always tell the
 * difference between "we sent it" and "we would have sent it".
 *
 * Phase K layers bulk BCC sending, attachments and per-recipient Notification
 * rows on top of `sendRawMail`; this module stays the single place that
 * actually talks to an SMTP server.
 */

export type MailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type SendMailInput = {
  to: string | string[];
  bcc?: string[];
  subject: string;
  text: string;
  html?: string;
  attachments?: MailAttachment[];
  /** Overrides the env transport, for per-faculty Mail Center credentials. */
  transportOverride?: SmtpCredentials;
  fromName?: string;
};

export type SmtpCredentials = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
};

export type SendMailResult = {
  delivered: boolean;
  mode: "LIVE" | "DRY_RUN";
  /** Which transport ran: "env-smtp" | "faculty-smtp" | "dry-run". */
  smtpMode: string;
  messageId?: string;
  previewUrl?: string;
  error?: string;
};

export function isDryRun() {
  return process.env.MAIL_DRY_RUN !== "false";
}

function envCredentials(): SmtpCredentials | null {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } =
    process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  return {
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: SMTP_SECURE === "true",
    user: SMTP_USER,
    pass: SMTP_PASS,
  };
}

/** True when a live send is actually possible right now. */
export function isMailConfigured(override?: SmtpCredentials) {
  return !isDryRun() && Boolean(override ?? envCredentials());
}

function createTransport(creds: SmtpCredentials): Transporter {
  return nodemailer.createTransport({
    host: creds.host,
    port: creds.port,
    secure: creds.secure,
    auth: { user: creds.user, pass: creds.pass },
  });
}

function fromAddress(creds: SmtpCredentials | null, fromName?: string) {
  const configured = process.env.SMTP_FROM;
  if (configured && !fromName) return configured;
  const address = creds?.user ?? "no-reply@example.com";
  return `${fromName ?? "Campus Here"} <${address}>`;
}

/** Verify credentials without sending anything. */
export async function verifySmtp(creds: SmtpCredentials) {
  const transport = createTransport(creds);
  try {
    await transport.verify();
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    transport.close();
  }
}

export async function sendRawMail(
  input: SendMailInput,
): Promise<SendMailResult> {
  const creds = input.transportOverride ?? envCredentials();
  const recipients = Array.isArray(input.to) ? input.to : [input.to];

  if (isDryRun() || !creds) {
    const reason = isDryRun() ? "MAIL_DRY_RUN=true" : "no SMTP credentials";
    console.info(
      `[mail:dry-run] (${reason}) to=${recipients.join(",")}` +
        `${input.bcc?.length ? ` bcc=${input.bcc.length}` : ""}` +
        ` subject="${input.subject}"\n${input.text}`,
    );
    return { delivered: false, mode: "DRY_RUN", smtpMode: "dry-run" };
  }

  const transport = createTransport(creds);
  try {
    const info = await transport.sendMail({
      from: fromAddress(creds, input.fromName),
      to: recipients,
      bcc: input.bcc,
      subject: input.subject,
      text: input.text,
      html: input.html,
      attachments: input.attachments,
    });
    return {
      delivered: true,
      mode: "LIVE",
      smtpMode: input.transportOverride ? "faculty-smtp" : "env-smtp",
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info) || undefined,
    };
  } catch (error) {
    return {
      delivered: false,
      mode: "LIVE",
      smtpMode: input.transportOverride ? "faculty-smtp" : "env-smtp",
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    transport.close();
  }
}
