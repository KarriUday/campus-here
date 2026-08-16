import type { Metadata } from "next";
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  ListOrdered,
  MapPin,
  Sparkles,
  User,
} from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { NoGroupPanel } from "@/components/student/group-panel";
import { getSelectedCycle } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/rbac";
import { findMyGroup } from "@/server/services/groups";
import { formatCgpa } from "@/lib/utils";
import {
  PHASE_RUBRICS,
  getVerdictConfig,
} from "@/lib/evaluation-rubrics";
import type { ReviewPhase } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Review Timeline & Marksheets" };

const DATE_FORMAT = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

const PHASES = [
  { key: "R0" as ReviewPhase, label: "Review 0 (R0)", subtitle: "Topic & Synopsis Defense" },
  { key: "P1" as ReviewPhase, label: "Phase 1 (P1)", subtitle: "Architecture & Mid-term Progress" },
  { key: "P2" as ReviewPhase, label: "Phase 2 (P2)", subtitle: "Final Implementation & Defense" },
];

const STATUS_TONE: Record<string, BadgeTone> = {
  SCHEDULED: "success",
  COMPLETED: "info",
  CANCELLED: "error",
};

export default async function TimelinePage() {
  const session = await requirePage(["STUDENT"]);
  const cycle = await getSelectedCycle();
  const studentId = session.studentId;

  if (!cycle || !studentId) {
    return (
      <>
        <PageHeader title="Review Timeline" role="Student" />
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

  const group = await findMyGroup(studentId, cycle.id);

  if (!group) {
    return (
      <>
        <PageHeader
          title="Review Timeline & Marksheets"
          subtitle="Track milestones, multi-criteria rubric scores, and guide feedback across R0, P1, and P2."
          cycleName={cycle.name}
          role="Student"
        />
        <NoGroupPanel groupSize={cycle.groupSize} />
      </>
    );
  }

  const evaluations = await prisma.evaluation.findMany({
    where: { groupId: group.id },
    include: {
      studentScores: {
        where: { studentId },
      },
    },
  });

  const evaluationBySession = new Map(
    evaluations.map((entry) => [entry.sessionId, entry]),
  );

  return (
    <>
      <PageHeader
        title="Review Timeline & Marksheets"
        subtitle="Track review schedules, multi-criteria rubric breakdowns, guide action items, and final outcomes."
        cycleName={cycle.name}
        role="Student"
      />

      {/* Group & Project Overview Card */}
      <Card className="mb-6">
        <CardBody className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#717182]">
              Assigned Group
            </span>
            <div className="flex items-baseline gap-2">
              <h2 className="text-lg font-bold text-[#28265f]">{group.code}</h2>
              <span className="text-xs font-medium text-[#717182]">
                ({group.domain?.name ?? "General CSE"})
              </span>
            </div>
            <p className="mt-1 text-xs text-[#333]">
              Project: <strong className="text-[#1f2937]">{group.title?.title ?? "Untitled Project"}</strong>
            </p>
          </div>

          <div className="rounded-xl border border-[#e5e5ec] bg-[#f8f8fc] px-4 py-2.5 text-xs">
            <span className="text-[#717182]">Faculty Guide:</span>
            <p className="font-bold text-[#28265f]">
              {group.allocation?.faculty?.fullName ?? "Guide not allocated yet"}
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Review Milestones Pipeline */}
      <div className="space-y-6">
        {PHASES.map((phase, idx) => {
          const sessionItem = group.sessions.find((s) => s.phase === phase.key);
          const evaluation = sessionItem ? evaluationBySession.get(sessionItem.id) : undefined;
          const rubricDef = PHASE_RUBRICS[phase.key];
          const rubricScores = (evaluation?.rubricScores as Record<string, number>) ?? {};
          const verdictCfg = evaluation ? getVerdictConfig(evaluation.verdict) : null;
          const individualScore = evaluation?.studentScores[0];

          return (
            <Card key={phase.key} className="overflow-hidden border border-[#e2e2e9]">
              <div className="border-b border-[#e5e5ec] bg-[#fcfcfe] px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-full bg-[#28265f] text-xs font-bold text-white">
                      {idx + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-[#242157]">{phase.label}</h3>
                      <p className="text-xs text-[#717182]">{phase.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {verdictCfg && (
                      <span className={`rounded-md border px-2.5 py-1 text-xs font-bold ${verdictCfg.bg}`}>
                        {verdictCfg.label}
                      </span>
                    )}
                    <Badge tone={sessionItem ? (STATUS_TONE[sessionItem.status] ?? "neutral") : "neutral"}>
                      {sessionItem ? sessionItem.status : "PENDING"}
                    </Badge>
                  </div>
                </div>
              </div>

              <CardBody className="space-y-5 p-6">
                {/* Session Schedule Details */}
                <div className="flex flex-wrap gap-4 text-xs text-[#525363]">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-[#28265f]" />
                    {sessionItem ? DATE_FORMAT.format(sessionItem.scheduledAt) : "Date to be announced"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-[#28265f]" />
                    {sessionItem ? sessionItem.venue : "Venue TBA"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5 text-[#28265f]" />
                    {sessionItem ? `${sessionItem.durationMinutes} mins duration` : "20 mins"}
                  </span>
                </div>

                {/* If Evaluated: Show Comprehensive Rubric Breakdown */}
                {evaluation ? (
                  <div className="space-y-4 rounded-xl border border-[#e2e2e9] bg-[#fdfdfe] p-5">
                    {/* Score Highlights Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee] pb-4">
                      <div>
                        <span className="text-xs font-semibold text-[#717182]">Group Cumulative Score</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-black text-[#28265f]">
                            {formatCgpa(Number(evaluation.score))}
                          </span>
                          <span className="text-xs font-bold text-[#8e8f9e]">/ 10.0</span>
                        </div>
                      </div>

                      {individualScore && (
                        <div className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-3.5 py-1.5 text-right">
                          <span className="text-[0.68rem] font-semibold text-[#1e40af]">Your Individual Score</span>
                          <p className="text-base font-black text-[#1e3a8a]">
                            {formatCgpa(Number(individualScore.score))} / 10
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Criteria Itemization Bars */}
                    <div>
                      <h4 className="mb-2 text-xs font-bold text-[#28265f]">Rubric Criteria Itemization</h4>
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {rubricDef.criteria.map((c) => {
                          const pts = rubricScores[c.id] ?? 0;
                          const pct = (pts / c.maxScore) * 100;
                          return (
                            <div key={c.id} className="rounded-lg border border-[#e5e5ec] bg-white p-3 text-xs">
                              <div className="flex justify-between font-semibold">
                                <span className="text-[#1f2937]">{c.name}</span>
                                <span className="text-[#28265f]">
                                  {pts.toFixed(2)} <span className="text-[#888]">/ {c.maxScore}</span>
                                </span>
                              </div>
                              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#e5e5ec]">
                                <div
                                  className="h-full bg-[#28265f] transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Guide Remarks */}
                    {evaluation.remarks && (
                      <div className="rounded-lg border border-[#e5e5ec] bg-[#f9fafb] p-3 text-xs">
                        <span className="font-bold text-[#333]">Guide Feedback & Remarks:</span>
                        <p className="mt-0.5 italic text-[#4b5563]">{evaluation.remarks}</p>
                      </div>
                    )}

                    {/* Action Items Callout */}
                    {evaluation.actionItems && (
                      <div className="rounded-lg border border-[#fca5a5] bg-[#fff5f5] p-3 text-xs">
                        <span className="font-bold text-[#991b1b]">
                          ⚠️ Required Action Items for Next Review:
                        </span>
                        <p className="mt-1 whitespace-pre-line font-medium text-[#7f1d1d]">
                          {evaluation.actionItems}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[#d8d9e2] p-4 text-center text-xs text-[#717182]">
                    Review not evaluated yet. Your guide will assess your presentation against standard rubrics once completed.
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>
    </>
  );
}
