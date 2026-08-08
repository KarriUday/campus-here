"use client";

import { Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

type Issue = {
  rowNumber: number;
  usn?: string;
  email?: string;
  message: string;
};

type PreviewResponse = {
  applied: boolean;
  totalRows: number;
  validCount: number;
  errorCount: number;
  duplicateCount?: number;
  preview?: Array<Record<string, unknown>>;
  issues?: Issue[];
  truncatedIssues?: number;
  created?: number;
  enrolled?: number;
  updated?: number;
  imported?: number;
};

export type ImportEntity = "students" | "faculty" | "titles";

const ENDPOINTS: Record<ImportEntity, string> = {
  students: "/api/students/upload",
  faculty: "/api/faculty/upload",
  titles: "/api/titles/import",
};

const PREVIEW_COLUMNS: Record<
  ImportEntity,
  Array<{ key: string; header: string; numeric?: boolean }>
> = {
  students: [
    { key: "usn", header: "USN" },
    { key: "fullName", header: "Name" },
    { key: "cgpa", header: "CGPA", numeric: true },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },
  ],
  faculty: [
    { key: "fullName", header: "Name" },
    { key: "email", header: "Email" },
    { key: "designation", header: "Designation" },
    { key: "domains", header: "Domains" },
    { key: "capacity", header: "Capacity", numeric: true },
  ],
  titles: [
    { key: "title", header: "Title" },
    { key: "domainLabel", header: "Domain" },
    { key: "guideLabel", header: "Guide" },
    { key: "cycleLabel", header: "Cycle" },
  ],
};

function displayCell(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ") || "—";
  if (typeof value === "boolean") return value ? "yes" : "no";
  return String(value);
}

export function CsvImportPanel({
  entity,
  title,
  subtitle,
  hint,
  allowPaste = false,
}: {
  entity: ImportEntity;
  title: string;
  subtitle: string;
  hint: string;
  allowPaste?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pasted, setPasted] = useState("");
  const [result, setResult] = useState<PreviewResponse | null>(null);
  const [busy, setBusy] = useState<"preview" | "apply" | null>(null);

  async function send(apply: boolean) {
    if (!file && !pasted.trim()) {
      toast({
        tone: "warning",
        title: "Nothing to upload",
        description: "Choose a CSV file or paste the rows first.",
      });
      return;
    }

    setBusy(apply ? "apply" : "preview");
    try {
      const form = new FormData();
      if (file) form.set("file", file);
      else form.set("text", pasted);
      form.set("apply", String(apply));

      const res = await fetch(ENDPOINTS[entity], { method: "POST", body: form });
      const data = (await res.json()) as PreviewResponse & { error?: string };

      if (!res.ok) {
        toast({
          tone: "error",
          title: "Import failed",
          description: data.error ?? "The server rejected this file.",
        });
        if (data.issues) setResult({ ...data, applied: false } as PreviewResponse);
        return;
      }

      setResult(data);

      if (apply) {
        const parts = [
          data.created !== undefined ? `${data.created} created` : null,
          data.enrolled ? `${data.enrolled} enrolled` : null,
          data.updated !== undefined ? `${data.updated} updated` : null,
          data.imported !== undefined ? `${data.imported} imported` : null,
        ].filter(Boolean);
        toast({
          tone: "success",
          title: "Import applied",
          description: parts.join(" · ") || `${data.validCount} rows written.`,
        });
        setFile(null);
        setPasted("");
        if (fileRef.current) fileRef.current.value = "";
        router.refresh();
      } else {
        toast({
          tone: data.errorCount > 0 ? "warning" : "info",
          title: "Validated",
          description: `${data.validCount} row(s) ready, ${data.errorCount} rejected.`,
        });
      }
    } catch {
      toast({
        tone: "error",
        title: "Could not reach the server",
        description: "Check that the development server is still running.",
      });
    } finally {
      setBusy(null);
    }
  }

  const columns = PREVIEW_COLUMNS[entity];
  const canApply = Boolean(result && !result.applied && result.validCount > 0);

  return (
    <Card>
      <CardHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            <a
              href={`/api/samples?kind=${entity}`}
              className="border-border bg-surface-raised text-ink hover:bg-surface inline-flex h-8 items-center gap-1.5 border px-3 text-xs font-semibold transition-colors"
            >
              <Download className="size-3.5" aria-hidden />
              Sample CSV
            </a>
            <Button
              size="sm"
              variant="secondary"
              loading={busy === "preview"}
              onClick={() => send(false)}
            >
              Validate
            </Button>
            <Button
              size="sm"
              loading={busy === "apply"}
              disabled={!canApply}
              onClick={() => send(true)}
              icon={<Upload className="size-3.5" aria-hidden />}
            >
              Apply import
            </Button>
          </>
        }
      />
      <CardBody className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor={`file-${entity}`}
              className="text-ink text-sm font-medium"
            >
              CSV file
            </label>
            <input
              id={`file-${entity}`}
              ref={fileRef}
              type="file"
              accept=".csv,text/csv,.txt"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setResult(null);
              }}
              className="border-border bg-surface-raised text-ink file:bg-surface file:text-ink mt-1.5 block w-full cursor-pointer border text-sm file:mr-3 file:cursor-pointer file:border-0 file:px-3 file:py-2.5 file:text-sm file:font-medium"
            />
            <p className="text-ink-tertiary mt-1.5 text-xs">{hint}</p>
          </div>

          {allowPaste && (
            <Textarea
              label="…or paste rows"
              placeholder={"One title per line, or paste CSV rows including the header."}
              value={pasted}
              onChange={(event) => {
                setPasted(event.target.value);
                setResult(null);
              }}
              className="min-h-24"
            />
          )}
        </div>

        {result && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone="neutral">{result.totalRows} rows read</Badge>
              <Badge tone={result.validCount > 0 ? "success" : "neutral"}>
                {result.validCount} valid
              </Badge>
              <Badge tone={result.errorCount > 0 ? "error" : "neutral"}>
                {result.errorCount} rejected
              </Badge>
              {result.duplicateCount ? (
                <Badge tone="warning">
                  {result.duplicateCount} already in corpus
                </Badge>
              ) : null}
              {result.applied && <Badge tone="success">Applied</Badge>}
            </div>

            {!result.applied && result.preview && result.preview.length > 0 && (
              <div>
                <p className="text-ink mb-2 text-sm font-medium">
                  Preview of rows that will be imported
                </p>
                <DataTable
                  rows={result.preview}
                  rowKey={(_row, index) => `preview-${index}`}
                  columns={columns.map(
                    (col): Column<Record<string, unknown>> => ({
                      key: col.key,
                      header: col.header,
                      numeric: col.numeric,
                      render: (row) => displayCell(row[col.key]),
                    }),
                  )}
                />
              </div>
            )}

            {result.issues && result.issues.length > 0 && (
              <div>
                <p className="text-ink mb-2 text-sm font-medium">
                  Rejected rows
                </p>
                <DataTable
                  rows={result.issues}
                  rowKey={(row, index) => `issue-${row.rowNumber}-${index}`}
                  columns={[
                    {
                      key: "row",
                      header: "Row",
                      numeric: true,
                      render: (row) => row.rowNumber,
                    },
                    {
                      key: "ref",
                      header: "Reference",
                      render: (row) => row.usn ?? row.email ?? "—",
                    },
                    {
                      key: "message",
                      header: "Issue",
                      render: (row) => (
                        <span className="text-error-ink">{row.message}</span>
                      ),
                    },
                  ]}
                />
                {result.truncatedIssues ? (
                  <p className="text-ink-tertiary mt-2 text-xs">
                    {result.truncatedIssues} further issue(s) not shown.
                  </p>
                ) : null}
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
