"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/**
 * Downloads a real .xlsx from the shared ReportService.
 *
 * Scope is decided server-side from the session, so this button is identical
 * on an admin screen and a faculty screen — the guide simply receives their
 * own rows.
 */
export function ExportButton({
  type,
  sessionId,
  children,
  variant = "secondary",
  size = "sm",
}: {
  type: string;
  sessionId?: string;
  children?: React.ReactNode;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const params = new URLSearchParams({ type });
      if (sessionId) params.set("sessionId", sessionId);

      const res = await fetch(`/api/reports/export?${params}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({
          tone: "error",
          title: "Export failed",
          description: data.error ?? `Server returned ${res.status}.`,
        });
        return;
      }

      // Filename comes from the server so it always matches the report.
      const disposition = res.headers.get("content-disposition") ?? "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] ?? `${type}.xlsx`;

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      toast({
        tone: "success",
        title: "Downloaded",
        description: `${filename} (${(blob.size / 1024).toFixed(0)} KB)`,
      });
    } catch {
      toast({ tone: "error", title: "Could not reach the server." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      loading={busy}
      onClick={download}
      icon={<Download className="size-3.5" aria-hidden />}
    >
      {children ?? "Export Excel"}
    </Button>
  );
}
