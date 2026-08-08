"use client";

import { Bell, ScanLine, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

export type DetectedEventRow = {
  id: string;
  title: string;
  phase: string;
  eventDate: string;
  confidence: string;
  sourceLine: string;
  reminderCount: number;
};

export type LatestImport = {
  filename: string;
  extractedChars: number;
  detectedEvents: number;
  createdAt: string;
  uploadedBy: string;
  textPreview: string;
} | null;

const CONFIDENCE_TONE: Record<string, BadgeTone> = {
  HIGH: "success",
  MEDIUM: "neutral",
  LOW: "warning",
};

export function CalendarPanel({
  latest,
  events,
}: {
  latest: LatestImport;
  events: DetectedEventRow[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pasted, setPasted] = useState("");
  const [busy, setBusy] = useState<"scan" | "reminders" | null>(null);

  async function scan() {
    if (!file && !pasted.trim()) {
      toast({
        tone: "warning",
        title: "Nothing to scan",
        description: "Choose a PDF or paste the calendar text.",
      });
      return;
    }
    setBusy("scan");
    try {
      const form = new FormData();
      if (file) form.set("file", file);
      if (pasted.trim()) form.set("text", pasted.trim());

      const res = await fetch("/api/calendar", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        toast({ tone: "error", title: "Scan failed", description: data.error });
        return;
      }
      toast({
        tone: data.events.length > 0 ? "success" : "warning",
        title: `${data.events.length} review date(s) detected`,
        description: `${data.extractedChars.toLocaleString()} characters extracted from ${data.filename}.`,
      });
      setFile(null);
      setPasted("");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function generate() {
    setBusy("reminders");
    try {
      const res = await fetch("/api/reminders", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast({ tone: "error", title: "Could not generate", description: data.error });
        return;
      }
      toast({
        tone: "success",
        title: `${data.created} reminders generated`,
        description:
          `Two per event (15-day and 7-day) across ${data.events} date(s).` +
          (data.skippedAlreadySent
            ? ` ${data.skippedAlreadySent} already sent were left alone.`
            : ""),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function removeEvent(id: string) {
    const res = await fetch(`/api/calendar/events/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast({ tone: "error", title: "Could not remove", description: data.error });
      return;
    }
    toast({
      tone: "success",
      title: "Event removed",
      description: `${data.remindersRemoved} reminder(s) removed with it.`,
    });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Upload the academic calendar"
          subtitle="Text is extracted on the server. A scanned PDF has no text layer — paste it instead."
          actions={
            <>
              <Button
                variant="secondary"
                loading={busy === "scan"}
                onClick={scan}
                icon={<ScanLine className="size-3.5" aria-hidden />}
              >
                Scan
              </Button>
              <Button
                loading={busy === "reminders"}
                disabled={events.length === 0}
                onClick={generate}
                icon={<Bell className="size-3.5" aria-hidden />}
              >
                Generate reminders
              </Button>
            </>
          }
        />
        <CardBody className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="calendar-pdf" className="text-ink text-sm font-medium">
              Calendar PDF
            </label>
            <input
              id="calendar-pdf"
              ref={fileRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="border-border bg-surface-raised text-ink file:bg-surface file:text-ink mt-1.5 block w-full cursor-pointer border text-sm file:mr-3 file:cursor-pointer file:border-0 file:px-3 file:py-2.5 file:text-sm file:font-medium"
            />
            <p className="text-ink-tertiary mt-1.5 text-xs">
              Up to 10MB. Both a 15-day and a 7-day reminder are created for
              every detected date, dispatched at 09:00.
            </p>
          </div>
          <Textarea
            label="…or paste the calendar text"
            value={pasted}
            onChange={(event) => setPasted(event.target.value)}
            placeholder="Paste rows such as: Major project review 0 (R0) - 12 September 2026"
            className="min-h-28"
            hint="Pasted text takes precedence over an uploaded file."
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Detected review dates"
          subtitle={
            latest
              ? `${latest.filename} · ${latest.extractedChars.toLocaleString()} characters · uploaded by ${latest.uploadedBy}`
              : "No calendar has been scanned for this cycle yet."
          }
          actions={<Badge tone="neutral">{events.length} event(s)</Badge>}
        />
        <CardBody className="space-y-4">
          <DataTable
            rows={events}
            rowKey={(row) => row.id}
            emptyTitle="Nothing detected yet"
            emptyDescription="Scan a calendar PDF, or paste its text if the PDF is a scan."
            columns={[
              {
                key: "date",
                header: "Date",
                render: (row) => <span className="mono">{row.eventDate}</span>,
              },
              {
                key: "phase",
                header: "Phase",
                render: (row) => <Badge tone="info">{row.phase}</Badge>,
              },
              { key: "title", header: "Title", render: (row) => row.title },
              {
                key: "confidence",
                header: "Confidence",
                render: (row) => (
                  <Badge tone={CONFIDENCE_TONE[row.confidence] ?? "neutral"}>
                    {row.confidence}
                  </Badge>
                ),
              },
              {
                key: "source",
                header: "Source line",
                render: (row) => (
                  <span className="text-ink-secondary text-xs">
                    {row.sourceLine.slice(0, 90)}
                    {row.sourceLine.length > 90 ? "…" : ""}
                  </span>
                ),
              },
              {
                key: "reminders",
                header: "Reminders",
                numeric: true,
                render: (row) => row.reminderCount,
              },
              {
                key: "remove",
                header: "",
                render: (row) => (
                  <button
                    type="button"
                    onClick={() => removeEvent(row.id)}
                    aria-label={`Remove ${row.title} on ${row.eventDate}`}
                    className="text-ink-tertiary hover:text-error-ink rounded p-1 transition-colors"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                ),
              },
            ]}
          />

          {latest && (
            <details className="border-border-subtle border p-3">
              <summary className="text-ink cursor-pointer text-sm font-medium">
                Extracted text (first 4,000 characters)
              </summary>
              <pre className="text-ink-secondary border-border-subtle mt-3 max-h-72 overflow-auto border p-3 text-xs whitespace-pre-wrap">
                {latest.textPreview}
              </pre>
              <p className="text-ink-tertiary mt-2 text-xs">
                Stored with the import, so it survives a reload — the prototype
                kept this in memory and lost it on every re-render.
              </p>
            </details>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
