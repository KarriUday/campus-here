"use client";

import { CheckCircle2, Loader2, ShieldAlert, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export type SignalBreakdown = {
  tfidf: number;
  dice: number;
  containment: number;
  charNgram: number;
  levenshtein: number;
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

const VERDICT_META = {
  BLOCKED: {
    tone: "error" as const,
    icon: ShieldAlert,
    label: "Blocked",
    detail:
      "This is effectively the same project as one already registered. Choose a different title.",
  },
  WARNING: {
    tone: "warning" as const,
    icon: TriangleAlert,
    label: "Close match",
    detail:
      "Similar work already exists. You may proceed, but your guide will see this score.",
  },
  ALLOWED: {
    tone: "success" as const,
    icon: CheckCircle2,
    label: "Original",
    detail: "No sufficiently similar title found in the corpus.",
  },
};

const percent = (value: number) => `${Math.round(value * 100)}%`;

/** One labelled 0–1 bar, so the score is legible without reading the number. */
function SignalBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-ink-secondary text-xs">{label}</span>
        <span className="text-ink mono text-xs font-medium">
          {value.toFixed(2)}
        </span>
      </div>
      <div className="bg-surface mt-1 h-1.5 overflow-hidden rounded-full">
        <div
          className="bg-primary h-full rounded-full"
          style={{ width: `${Math.max(2, value * 100)}%` }}
        />
      </div>
    </div>
  );
}

export function DuplicateChecker({
  initialTitle = "",
  excludeTitleId,
  label = "Proposed title",
  onReport,
}: {
  initialTitle?: string;
  excludeTitleId?: string;
  label?: string;
  onReport?: (report: SimilarityReport | null) => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [report, setReport] = useState<SimilarityReport | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ignore responses that arrive after a newer request has been fired.
  const requestId = useRef(0);
  const onReportRef = useRef(onReport);

  // Kept in an effect rather than assigned during render, so a re-render
  // caused by something else cannot swap the callback mid-flight.
  useEffect(() => {
    onReportRef.current = onReport;
  });

  useEffect(() => {
    const trimmed = title.trim();
    const id = ++requestId.current;

    // Debounced so a live check does not fire once per keystroke. The
    // too-short case is handled inside the timer too, so no state is set
    // synchronously while the effect body runs.
    const timer = setTimeout(async () => {
      if (trimmed.length < 3) {
        if (id !== requestId.current) return;
        setReport(null);
        setError(null);
        onReportRef.current?.(null);
        return;
      }

      setChecking(true);
      try {
        const res = await fetch("/api/titles/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmed, excludeTitleId }),
        });
        const data = await res.json();
        if (id !== requestId.current) return;

        if (!res.ok) {
          setError(data.error ?? "Could not check this title.");
          setReport(null);
          onReportRef.current?.(null);
          return;
        }
        setError(null);
        setReport(data.report);
        onReportRef.current?.(data.report);
      } catch {
        if (id === requestId.current) setError("Could not reach the server.");
      } finally {
        if (id === requestId.current) setChecking(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [title, excludeTitleId]);

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
        placeholder="e.g. Adaptive Study Planner using Machine Learning"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        hint="Scored live against every registered and imported title."
      />

      {checking && (
        <p className="text-ink-secondary flex items-center gap-2 text-sm">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Checking against the corpus…
        </p>
      )}

      {error && (
        <p role="alert" className="bg-error-soft text-error-ink rounded-lg px-3 py-2 text-sm">
          {error}
        </p>
      )}

      {report && meta && Icon && (
        <div aria-live="polite" className="space-y-4">
          <div
            className={cn(
              "flex flex-wrap items-center gap-3 rounded-xl px-4 py-3",
              report.verdict === "BLOCKED" && "bg-error-soft",
              report.verdict === "WARNING" && "bg-warning-soft",
              report.verdict === "ALLOWED" && "bg-success-soft",
            )}
          >
            <Icon
              className={cn(
                "size-5 shrink-0",
                report.verdict === "BLOCKED" && "text-error-ink",
                report.verdict === "WARNING" && "text-warning-ink",
                report.verdict === "ALLOWED" && "text-success-ink",
              )}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-ink text-sm font-semibold">
                {meta.label} · {percent(report.score)} similar
              </p>
              <p className="text-ink-secondary text-xs">{meta.detail}</p>
            </div>
            <Badge tone={meta.tone}>
              {report.verdict === "BLOCKED"
                ? "≥ 95%"
                : report.verdict === "WARNING"
                  ? "80–94%"
                  : "< 80%"}
            </Badge>
          </div>

          {tokenSummary && (
            <p className="text-ink-tertiary text-xs">
              Compared on:{" "}
              <span className="mono text-ink-secondary">{tokenSummary}</span>{" "}
              — filler words and abbreviations are normalised away before scoring.
            </p>
          )}

          {report.matches.length > 0 ? (
            <div className="space-y-3">
              <p className="text-ink text-sm font-medium">
                Closest titles in the corpus ({report.corpusSize} checked)
              </p>
              {report.matches.map((match) => (
                <Card key={match.id} className="shadow-none">
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
                            : match.score >= 0.8
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {percent(match.score)}
                      </Badge>
                    }
                  />
                  <CardBody className="pt-3">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      <SignalBar label="TF-IDF cosine" value={match.signals.tfidf} />
                      <SignalBar label="Dice overlap" value={match.signals.dice} />
                      <SignalBar label="Containment" value={match.signals.containment} />
                      <SignalBar label="Char 3-gram" value={match.signals.charNgram} />
                      <SignalBar label="Levenshtein" value={match.signals.levenshtein} />
                    </div>
                    {match.sharedTerms.length > 0 && (
                      <p className="text-ink-secondary mt-3 text-xs">
                        Matched words:{" "}
                        {match.sharedTerms.map((term) => (
                          <span
                            key={term}
                            className="bg-primary-soft text-primary mono mr-1 inline-block rounded px-1.5 py-0.5"
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
          ) : (
            <p className="text-ink-secondary text-sm">
              Nothing comparable in the corpus yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
