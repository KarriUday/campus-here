"use client";

import {
  BrainCircuit,
  CheckCircle2,
  Code2,
  ExternalLink,
  FolderArchive,
  GitBranch,
  GraduationCap,
  Loader2,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
  Users,
} from "lucide-react";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export type SignalBreakdown = {
  semantic?: number;
  tfidf: number;
  dice: number;
  containment: number;
  charNgram: number;
  levenshtein: number;
};

export type SeniorAuthor = {
  name: string;
  usn: string;
  batch: string;
};

export type SimilarityMatch = {
  id: string;
  title: string;
  score: number;
  signals: SignalBreakdown;
  sharedTerms: string[];
  domainLabel?: string | null;
  guideLabel?: string | null;
  cycleLabel?: string | null;
  seniorAuthors?: SeniorAuthor[] | null;
  githubUrl?: string | null;
  driveUrl?: string | null;
  projectAbstract?: string | null;
};

export type SimilarityReport = {
  score: number;
  verdict: "BLOCKED" | "WARNING" | "ALLOWED";
  normalized: string;
  tokens: string[];
  best: SimilarityMatch | null;
  matches: SimilarityMatch[];
  corpusSize: number;
};

export type ExtensionProposal = {
  isExtension: boolean;
  proposedInnovations: string;
  seniorReferenceId?: string;
};

const VERDICT_META = {
  BLOCKED: {
    tone: "error" as const,
    icon: ShieldAlert,
    label: "High Similarity (≥ 95%)",
    detail:
      "This is effectively identical to a past project. You can submit it under the 'Extension Track' with novel features, or choose a different title.",
  },
  WARNING: {
    tone: "warning" as const,
    icon: TriangleAlert,
    label: "Senior Prior-Art Found (70%–94%)",
    detail:
      "Significant conceptual overlap with senior work detected. Explore their GitHub repo, reports, and submit an Extension Track proposal.",
  },
  ALLOWED: {
    tone: "success" as const,
    icon: CheckCircle2,
    label: "Original Title (< 70%)",
    detail: "No significantly overlapping title or semantic concept found in the corpus.",
  },
};

const percent = (value: number) => `${Math.round(value * 100)}%`;

function SignalBar({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={highlight ? "rounded-lg bg-[#f0f0ff] p-2" : ""}>
      <div className="flex items-baseline justify-between gap-2">
        <span className={cn("text-xs font-semibold", highlight ? "text-[#28265f]" : "text-[#717182]")}>
          {label}
        </span>
        <span className="mono text-xs font-bold text-[#1f2937]">
          {value.toFixed(2)}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#e5e5ec]">
        <div
          className={cn("h-full transition-all", highlight ? "bg-[#28265f]" : "bg-[#4b5563]")}
          style={{ width: `${Math.max(3, value * 100)}%` }}
        />
      </div>
    </div>
  );
}

export function DuplicateChecker({
  initialTitle = "",
  value,
  onChange,
  excludeTitleId,
  label = "Proposed title",
  disabled = false,
  onReport,
  onExtensionChange,
}: {
  initialTitle?: string;
  value?: string;
  onChange?: (next: string) => void;
  excludeTitleId?: string;
  label?: string;
  disabled?: boolean;
  onReport?: (report: SimilarityReport | null) => void;
  onExtensionChange?: (proposal: ExtensionProposal) => void;
}) {
  const [internalTitle, setInternalTitle] = useState(initialTitle);
  const controlled = value !== undefined;
  const title = controlled ? value : internalTitle;
  const setTitle = (next: string) => {
    if (controlled) onChange?.(next);
    else setInternalTitle(next);
  };

  const [report, setReport] = useState<SimilarityReport | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Extension track proposal state
  const [isExtension, setIsExtension] = useState(false);
  const [innovations, setInnovations] = useState("");

  const requestId = useRef(0);
  const onReportRef = useRef(onReport);
  const onExtensionRef = useRef(onExtensionChange);

  useEffect(() => {
    onReportRef.current = onReport;
    onExtensionRef.current = onExtensionChange;
  });

  useEffect(() => {
    const trimmed = title.trim();
    const id = ++requestId.current;

    const timer = setTimeout(async () => {
      if (trimmed.length < 3) {
        if (id !== requestId.current) return;
        setReport(null);
        setError(null);
        onReportRef.current?.(null);
        return;
      }

      setChecking(true);
      setError(null);
      try {
        const res = await fetch("/api/titles/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmed, excludeTitleId }),
        });

        if (id !== requestId.current) return;

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? `Error (${res.status}): Could not check title.`);
          setReport(null);
          onReportRef.current?.(null);
          return;
        }

        const data = await res.json();
        if (id !== requestId.current) return;

        setError(null);
        setReport(data.report);
        onReportRef.current?.(data.report);
      } catch (err: any) {
        console.error("Title check fetch failed:", err);
        if (id === requestId.current) {
          setError("Could not reach the server.");
        }
      } finally {
        if (id === requestId.current) setChecking(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [title, excludeTitleId, retryCount]);

  function handleExtensionToggle(checked: boolean) {
    setIsExtension(checked);
    onExtensionRef.current?.({
      isExtension: checked,
      proposedInnovations: innovations,
      seniorReferenceId: report?.best?.id,
    });
  }

  function handleInnovationsChange(val: string) {
    setInnovations(val);
    onExtensionRef.current?.({
      isExtension,
      proposedInnovations: val,
      seniorReferenceId: report?.best?.id,
    });
  }

  const meta = report ? VERDICT_META[report.verdict] : null;
  const Icon = meta?.icon;

  const tokenSummary = useMemo(
    () => (report?.tokens.length ? report.tokens.join(" · ") : null),
    [report],
  );

  return (
    <div className="space-y-4">
      <Input
        label={label}
        placeholder="e.g. Cold-Chain Integrity Ledger for Vaccine Transport"
        value={title}
        disabled={disabled}
        onChange={(event) => setTitle(event.target.value)}
        hint="Live semantic vector check against the entire institutional repository and senior archives."
      />

      {checking && (
        <p className="text-xs text-[#717182] flex items-center gap-2">
          <Loader2 className="size-3.5 animate-spin text-[#28265f]" aria-hidden />
          Running Semantic Vector & Corpus Analysis…
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-lg border border-[#f0c7ca] bg-[#fff4f4] px-3 py-2 text-xs text-[#9f242b]"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setRetryCount((c) => c + 1)}
            className="ml-2 rounded bg-[#9f242b] px-2 py-0.5 font-bold text-white hover:bg-[#7d1c22]"
          >
            Retry Check
          </button>
        </div>
      )}

      {report && meta && Icon && (
        <div aria-live="polite" className="space-y-4">
          {/* Main Verdict Banner */}
          <div
            className={cn(
              "flex flex-wrap items-center gap-3 rounded-xl border p-4",
              report.verdict === "BLOCKED" && "bg-[#fff5f5] border-[#fca5a5]",
              report.verdict === "WARNING" && "bg-[#fffbeb] border-[#fde68a]",
              report.verdict === "ALLOWED" && "bg-[#f0fdf4] border-[#bbf7d0]",
            )}
          >
            <Icon
              className={cn(
                "size-6 shrink-0",
                report.verdict === "BLOCKED" && "text-[#b9272f]",
                report.verdict === "WARNING" && "text-[#d97706]",
                report.verdict === "ALLOWED" && "text-[#16a34a]",
              )}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#1f2937]">
                {meta.label} · {percent(report.score)} Semantic Match
              </p>
              <p className="mt-0.5 text-xs text-[#4b5563]">{meta.detail}</p>
            </div>
            <Badge tone={meta.tone}>
              {report.verdict === "BLOCKED"
                ? "≥ 95%"
                : report.verdict === "WARNING"
                  ? "70–94%"
                  : "< 70%"}
            </Badge>
          </div>

          {tokenSummary && (
            <p className="text-[0.72rem] text-[#717182]">
              Semantic tokens analyzed: <span className="mono font-semibold text-[#28265f]">{tokenSummary}</span>
            </p>
          )}

          {/* --- SENIOR PRIOR-ART DISCOVERY CARD (> 70% SIMILARITY) --- */}
          {report.score >= 0.70 && report.best && (
            <div className="rounded-2xl border-2 border-[#28265f]/20 bg-gradient-to-b from-[#f9f9fd] to-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e2e2e9] pb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="size-5 text-[#28265f]" />
                  <h3 className="text-sm font-bold text-[#242157]">
                    Senior Project Archive Identified ({percent(report.best.score)} Match)
                  </h3>
                </div>
                <span className="rounded-md bg-[#28265f] px-2.5 py-0.5 text-xs font-bold text-white">
                  Senior Archive
                </span>
              </div>

              <div className="mt-3 space-y-3 text-xs">
                <div>
                  <span className="text-[#717182]">Past Project Title:</span>
                  <p className="text-sm font-bold text-[#1f2937]">{report.best.title}</p>
                  {report.best.projectAbstract && (
                    <p className="mt-1 text-xs text-[#555] italic">{report.best.projectAbstract}</p>
                  )}
                </div>

                {/* Senior Contributors */}
                {report.best.seniorAuthors && report.best.seniorAuthors.length > 0 && (
                  <div className="rounded-lg border border-[#e5e5ec] bg-white p-3">
                    <div className="mb-1.5 flex items-center gap-1.5 font-bold text-[#28265f]">
                      <Users className="size-3.5" />
                      <span>Senior Authors & Batch</span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {report.best.seniorAuthors.map((author, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs text-[#333]">
                          <span className="font-medium">{author.name}</span>
                          <span className="mono text-[0.7rem] text-[#717182]">
                            {author.usn} · {author.batch}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Senior GitHub & Drive Resources */}
                <div className="flex flex-wrap gap-3 pt-1">
                  {report.best.githubUrl && (
                    <a
                      href={report.best.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#24292e] bg-[#24292e] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-black"
                    >
                      <GithubIcon className="size-4" />
                      View Senior GitHub Repo
                      <ExternalLink className="size-3" />
                    </a>
                  )}

                  {report.best.driveUrl && (
                    <a
                      href={report.best.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#0284c7] bg-[#0284c7] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#0369a1]"
                    >
                      <FolderArchive className="size-4" />
                      View Reports & PPTs (Google Drive)
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>

                {/* --- EXTENSION & INNOVATION PROPOSAL SECTION --- */}
                <div className="mt-4 rounded-xl border border-[#d8d9e2] bg-[#f8f8fc] p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isExtension}
                      onChange={(e) => handleExtensionToggle(e.target.checked)}
                      className="mt-1 size-4 rounded accent-[#28265f]"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#28265f]">
                        Apply for Project Extension / Innovation Track (Phase 2.0)
                      </span>
                      <p className="mt-0.5 text-[0.72rem] text-[#555]">
                        Check this if your team proposes to extend this senior work with new novel algorithms, enhanced architecture, and significant feature additions.
                      </p>
                    </div>
                  </label>

                  {isExtension && (
                    <div className="mt-3 space-y-3 border-t border-[#e2e2e9] pt-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-[#28265f]">
                          Proposed Novel Features & Technical Delta
                        </label>
                        <Textarea
                          value={innovations}
                          onChange={(e) => handleInnovationsChange(e.target.value)}
                          placeholder="Detail your team's proposed innovations (e.g. 1. Adding Zero-Knowledge Proofs for verification; 2. Migrating to Next.js 16 microservices; 3. Real-time edge latency benchmarks)..."
                          className="min-h-20 text-xs bg-white"
                        />
                        <p className="text-[0.68rem] text-[#717182]">
                          This proposal will be submitted directly to your guide and coordinator for extension approval.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Detailed Signal Breakdown for all matches */}
          {report.matches.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-[#242157]">
                Corpus Comparison & Signal Breakdown ({report.corpusSize} historical titles evaluated)
              </p>
              {report.matches.map((match) => (
                <Card key={match.id} className="shadow-none border border-[#e5e5ec]">
                  <CardHeader
                    title={match.title}
                    subtitle={
                      [match.domainLabel, match.guideLabel, match.cycleLabel]
                        .filter(Boolean)
                        .join(" · ") || undefined
                    }
                    actions={
                      <Badge
                        tone={
                          match.score >= 0.95
                            ? "error"
                            : match.score >= 0.70
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {percent(match.score)}
                      </Badge>
                    }
                  />
                  <CardBody className="pt-2">
                    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-6">
                      <SignalBar
                        label="Semantic Vector"
                        value={match.signals.semantic ?? 0}
                        highlight
                      />
                      <SignalBar label="TF-IDF Cosine" value={match.signals.tfidf} />
                      <SignalBar label="Dice Overlap" value={match.signals.dice} />
                      <SignalBar label="Containment" value={match.signals.containment} />
                      <SignalBar label="Char 3-gram" value={match.signals.charNgram} />
                      <SignalBar label="Levenshtein" value={match.signals.levenshtein} />
                    </div>

                    {match.sharedTerms.length > 0 && (
                      <p className="mt-2.5 text-[0.72rem] text-[#717182]">
                        Matching concepts:{" "}
                        {match.sharedTerms.map((term) => (
                          <span
                            key={term}
                            className="mr-1 inline-block rounded bg-[#f0f0f5] px-1.5 py-0.5 font-mono font-medium text-[#28265f]"
                          >
                            {term}
                          </span>
                        ))}
                      </p>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
