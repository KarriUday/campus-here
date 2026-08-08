"use client";

import { Paperclip, Send, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

export type MailConfig = {
  dryRun: boolean;
  envConfigured: boolean;
  personalConfigured: boolean;
  personalUser: string | null;
  host: string | null;
  port: number;
  hint: string;
};

export type MailHistoryRow = {
  id: string;
  subject: string;
  bodyPreview: string;
  senderName: string;
  recipientCount: number;
  delivered: number;
  failed: number;
  mode: string;
  smtpMode: string | null;
  createdAt: string;
};

const MAX_TOTAL_MB = 20;

export function MailCenter({
  role,
  config,
  history,
  cycleName,
}: {
  role: "ADMIN" | "FACULTY";
  config: MailConfig;
  history: MailHistoryRow[];
  cycleName: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState(role === "ADMIN" ? "ALL" : "MY_GROUPS");
  const [subject, setSubject] = useState("Major Project — important update");
  const [body, setBody] = useState(
    "Dear students,\n\nPlease ensure your group has submitted the domain statement and six guide preferences before the review week.\n\nThank you.",
  );
  const [extraEmails, setExtraEmails] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);

  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [savingSmtp, setSavingSmtp] = useState(false);

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  const overLimit = totalBytes > MAX_TOTAL_MB * 1024 * 1024;

  async function send() {
    if (!subject.trim() || !body.trim()) {
      toast({ tone: "warning", title: "Subject and message are both required." });
      return;
    }
    if (overLimit) {
      toast({ tone: "error", title: `Attachments exceed ${MAX_TOTAL_MB}MB.` });
      return;
    }

    setSending(true);
    try {
      const form = new FormData();
      form.set("subject", subject);
      form.set("body", body);
      form.set("mode", mode);
      form.set("extraEmails", extraEmails);
      for (const file of files) form.append("attachments", file);

      const res = await fetch("/api/mail/send", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        toast({ tone: "error", title: "Send failed", description: data.error });
        return;
      }

      toast({
        tone: data.mode === "DRY_RUN" ? "info" : "success",
        title:
          data.mode === "DRY_RUN"
            ? `Recorded for ${data.recipientCount} recipient(s) — dry run`
            : `Delivered to ${data.delivered} of ${data.recipientCount}`,
        description:
          data.mode === "DRY_RUN"
            ? "Nothing left this machine. Every recipient still got an in-app notification."
            : data.error,
      });
      setFiles([]);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  async function saveSmtp() {
    if (!smtpUser.trim() || !smtpPass.trim()) {
      toast({ tone: "warning", title: "Enter the address and app password." });
      return;
    }
    setSavingSmtp(true);
    try {
      const res = await fetch("/api/mail/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smtpUser, smtpPass }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ tone: "error", title: "Could not save", description: data.error });
        return;
      }
      toast({ tone: "success", title: "Credentials saved", description: data.hint });
      setSmtpPass("");
      router.refresh();
    } finally {
      setSavingSmtp(false);
    }
  }

  async function testSmtp() {
    const res = await fetch("/api/mail/config", { method: "PUT" });
    const data = await res.json();
    toast({
      tone: data.ok ? "success" : "error",
      title: data.ok ? "SMTP credentials verified" : "Verification failed",
      description: data.error,
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Transport"
          subtitle={config.hint}
          actions={
            <>
              <Badge tone={config.dryRun ? "warning" : "success"}>
                {config.dryRun ? "Dry run" : "Live"}
              </Badge>
              {config.personalConfigured && (
                <Badge tone="info">Own credentials stored</Badge>
              )}
            </>
          }
        />
        <CardBody className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Sending address"
              type="email"
              autoComplete="username"
              placeholder="you@gmail.com"
              value={smtpUser}
              onChange={(event) => setSmtpUser(event.target.value)}
              hint={
                config.personalUser
                  ? `Currently stored: ${config.personalUser}`
                  : "Gmail, or any SMTP account."
              }
            />
            <Input
              label="App password"
              type="password"
              autoComplete="new-password"
              placeholder="16 characters, spaces are ignored"
              value={smtpPass}
              onChange={(event) => setSmtpPass(event.target.value)}
              hint="Stored encrypted with AES-256-GCM and never shown again."
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              loading={savingSmtp}
              onClick={saveSmtp}
              icon={<ShieldCheck className="size-3.5" aria-hidden />}
            >
              Save credentials
            </Button>
            {config.personalConfigured && (
              <Button variant="ghost" onClick={testSmtp}>
                Test connection
              </Button>
            )}
          </div>
          {config.dryRun && (
            <p className="bg-warning-soft text-warning-ink rounded-lg px-3 py-2 text-sm">
              Dry-run mode is on. Sends are fully recorded and students still
              receive in-app notifications, but no message leaves this machine.
              Set <code className="mono">MAIL_DRY_RUN=false</code> to go live.
            </p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Compose"
          subtitle={
            role === "ADMIN"
              ? `Everyone is BCC'd, so students never see each other's addresses.`
              : `Addressed to the students in the groups you guide, all BCC'd.`
          }
          actions={
            <Button
              onClick={send}
              loading={sending}
              icon={<Send className="size-3.5" aria-hidden />}
            >
              Send
            </Button>
          }
        />
        <CardBody className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Recipients"
              value={mode}
              onChange={(event) => setMode(event.target.value)}
            >
              {role === "ADMIN" && (
                <option value="ALL">All students in {cycleName}</option>
              )}
              <option value="MY_GROUPS">
                {role === "ADMIN" ? "Allocated groups only" : "My groups"}
              </option>
            </Select>
            <Input
              label="Additional addresses"
              placeholder="coordinator@example.edu, hod@example.edu"
              value={extraEmails}
              onChange={(event) => setExtraEmails(event.target.value)}
              hint="Comma-separated. Added on top of the selection above."
            />
          </div>

          <Input
            label="Subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          />
          <Textarea
            label="Message"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="min-h-40"
          />

          <div>
            <label htmlFor="mail-attachments" className="text-ink text-sm font-medium">
              Attachments
            </label>
            <input
              id="mail-attachments"
              ref={fileRef}
              type="file"
              multiple
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
              className="border-border bg-surface-raised text-ink file:bg-surface file:text-ink mt-1.5 block w-full cursor-pointer rounded-xl border text-sm file:mr-3 file:cursor-pointer file:border-0 file:px-3 file:py-2.5 file:text-sm file:font-medium"
            />
            <p
              className={
                overLimit
                  ? "text-error-ink mt-1.5 text-xs"
                  : "text-ink-tertiary mt-1.5 text-xs"
              }
            >
              <Paperclip className="mr-1 inline size-3" aria-hidden />
              {files.length} file(s), {(totalBytes / 1024 / 1024).toFixed(1)}MB of{" "}
              {MAX_TOTAL_MB}MB
            </p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Sent mail"
          subtitle="Every send is recorded, dry run or live."
        />
        <CardBody>
          <DataTable
            rows={history}
            rowKey={(row) => row.id}
            emptyTitle="Nothing sent yet"
            columns={[
              {
                key: "when",
                header: "When",
                render: (row) => new Date(row.createdAt).toLocaleString("en-IN"),
              },
              { key: "subject", header: "Subject", render: (row) => row.subject },
              { key: "by", header: "From", render: (row) => row.senderName },
              {
                key: "count",
                header: "Recipients",
                numeric: true,
                render: (row) => row.recipientCount,
              },
              {
                key: "mode",
                header: "Mode",
                render: (row) => (
                  <Badge tone={row.mode === "LIVE" ? "success" : "warning"}>
                    {row.mode === "LIVE"
                      ? `${row.delivered} delivered`
                      : "Dry run"}
                  </Badge>
                ),
              },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  );
}
