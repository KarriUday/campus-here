"use client";

import {
  Award,
  CheckCircle2,
  FileCheck2,
  ListChecks,
  Printer,
  Save,
  Sliders,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { ReviewPhase, ReviewVerdict } from "@/generated/prisma/enums";
import {
  PHASE_RUBRICS,
  calculateRubricTotal,
  getVerdictConfig,
} from "@/lib/evaluation-rubrics";

export type SessionOption = {
  id: string;
  groupId: string;
  groupCode: string;
  projectTitle: string;
  phase: string;
  scheduledAt: string;
  venue: string;
  attendanceMarked: boolean;
  evaluated: boolean;
  members?: Array<{
    id: string;
    usn: string;
    fullName: string;
    email: string;
  }>;
};

export type RosterEntry = {
  studentId: string;
  usn: string;
  fullName: string;
  status: "PRESENT" | "ABSENT" | null;
};

export type ExistingEvaluation = {
  sessionId: string;
  score: number;
  remarks: string | null;
  rubricScores?: Record<string, number>;
  verdict?: ReviewVerdict;
  actionItems?: string | null;
  studentScores?: Array<{
    studentId: string;
    score: number;
    remarks: string | null;
  }>;
};

const DATE_TIME = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

function sessionLabel(session: SessionOption) {
  return `${session.groupCode} · ${session.phase} · ${DATE_TIME.format(new Date(session.scheduledAt))}`;
}

export function AttendanceMarker({
  sessions,
  initialSessionId,
  initialRoster,
}: {
  sessions: SessionOption[];
  initialSessionId: string | null;
  initialRoster: RosterEntry[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState(initialSessionId ?? "");
  const [roster, setRoster] = useState(initialRoster);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadRoster(id: string) {
    setSessionId(id);
    if (!id) {
      setRoster([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance?sessionId=${id}`);
      const data = await res.json();
      if (!res.ok) {
        toast({ tone: "error", title: "Could not load roster", description: data.error });
        setRoster([]);
        return;
      }
      setRoster(data.roster);
    } finally {
      setLoading(false);
    }
  }

  function setStatus(studentId: string, status: "PRESENT" | "ABSENT") {
    setRoster((current) =>
      current.map((entry) =>
        entry.studentId === studentId ? { ...entry, status } : entry,
      ),
    );
  }

  async function save() {
    const entries = roster.filter((entry) => entry.status !== null);
    if (entries.length === 0) {
      toast({ tone: "warning", title: "Mark at least one student first." });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          entries: entries.map((entry) => ({
            studentId: entry.studentId,
            status: entry.status,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ tone: "error", title: "Could not save", description: data.error });
        return;
      }
      toast({
        tone: "success",
        title: `Attendance saved for ${data.marked} student(s)`,
        description: "The session is now marked completed.",
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const allMarked = roster.length > 0 && roster.every((e) => e.status !== null);

  return (
    <Card>
      <CardHeader
        title="Mark attendance"
        subtitle="Per review session. Saving marks the session completed."
        actions={
          <Button
            onClick={save}
            loading={busy}
            disabled={!sessionId || roster.length === 0}
            icon={<Save className="size-3.5" aria-hidden />}
          >
            Save attendance
          </Button>
        }
      />
      <CardBody className="space-y-4">
        {sessions.length === 0 ? (
          <EmptyState
            title="No sessions assigned to you"
            description="Sessions appear once the coordinator schedules reviews for your groups."
          />
        ) : (
          <>
            <Select
              label="Session"
              value={sessionId}
              onChange={(event) => loadRoster(event.target.value)}
            >
              <option value="">— Choose a session —</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {sessionLabel(session)}
                  {session.attendanceMarked ? " · marked" : ""}
                </option>
              ))}
            </Select>

            {loading && (
              <p className="text-ink-secondary text-sm">Loading roster…</p>
            )}

            {!loading && roster.length > 0 && (
              <>
                <ul className="space-y-2">
                  {roster.map((entry) => (
                    <li
                      key={entry.studentId}
                      className="border-border-subtle flex flex-wrap items-center justify-between gap-3 border px-4 py-2.5"
                    >
                      <span className="min-w-0">
                        <span className="text-ink text-sm font-medium">
                          {entry.fullName}
                        </span>{" "}
                        <span className="text-ink-secondary mono text-xs">
                          {entry.usn}
                        </span>
                      </span>
                      <span
                        className="inline-flex rounded-lg border border-[#e2e2e9] p-0.5"
                        role="radiogroup"
                        aria-label={`Attendance for ${entry.fullName}`}
                      >
                        <button
                          type="button"
                          role="radio"
                          aria-checked={entry.status === "PRESENT"}
                          onClick={() => setStatus(entry.studentId, "PRESENT")}
                          className={cn(
                            "flex items-center gap-1 px-3 py-1.5 text-xs font-semibold transition-colors",
                            entry.status === "PRESENT"
                              ? "bg-[#28265f] text-white"
                              : "text-ink-secondary hover:bg-surface",
                          )}
                        >
                          <CheckCircle2 className="size-3.5" aria-hidden />
                          Present
                        </button>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={entry.status === "ABSENT"}
                          onClick={() => setStatus(entry.studentId, "ABSENT")}
                          className={cn(
                            "flex items-center gap-1 px-3 py-1.5 text-xs font-semibold transition-colors",
                            entry.status === "ABSENT"
                              ? "bg-[#b9272f] text-white"
                              : "text-ink-secondary hover:bg-surface",
                          )}
                        >
                          <X className="size-3.5" aria-hidden />
                          Absent
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
                {!allMarked && (
                  <p className="text-ink-secondary text-sm">
                    {roster.filter((e) => e.status === null).length} student(s)
                    still unmarked — only marked students are saved.
                  </p>
                )}
              </>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}

export function EvaluationForm({
  sessions,
  existing,
}: {
  sessions: SessionOption[];
  existing: ExistingEvaluation[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const remarksId = useId();
  const actionItemsId = useId();

  const byId = new Map(existing.map((row) => [row.sessionId, row]));
  const initialSession = sessions[0];

  const [sessionId, setSessionId] = useState(initialSession?.id ?? "");
  const currentSession = sessions.find((s) => s.id === sessionId) ?? initialSession;
  const currentPhase = (currentSession?.phase ?? "R0") as ReviewPhase;
  const currentRubric = PHASE_RUBRICS[currentPhase] ?? PHASE_RUBRICS.R0;

  // Form state
  const [rubricScores, setRubricScores] = useState<Record<string, number>>(() => {
    const prior = byId.get(initialSession?.id ?? "");
    if (prior?.rubricScores && Object.keys(prior.rubricScores).length > 0) {
      return prior.rubricScores;
    }
    // Default evenly across criteria
    const initial: Record<string, number> = {};
    for (const c of currentRubric.criteria) {
      initial[c.id] = Math.round(c.maxScore * 0.8 * 10) / 10;
    }
    return initial;
  });

  const [verdict, setVerdict] = useState<ReviewVerdict>(
    () => byId.get(initialSession?.id ?? "")?.verdict ?? "APPROVED",
  );
  const [remarks, setRemarks] = useState(
    () => byId.get(initialSession?.id ?? "")?.remarks ?? "",
  );
  const [actionItems, setActionItems] = useState(
    () => byId.get(initialSession?.id ?? "")?.actionItems ?? "",
  );

  // Individual student scores map
  const [studentMarks, setStudentMarks] = useState<Record<string, number>>(() => {
    const prior = byId.get(initialSession?.id ?? "");
    const map: Record<string, number> = {};
    if (prior?.studentScores) {
      for (const st of prior.studentScores) {
        map[st.studentId] = st.score;
      }
    }
    return map;
  });

  const [busy, setBusy] = useState(false);
  const [showMarksheetModal, setShowMarksheetModal] = useState(false);

  // Compute live total score
  const computedTotal = calculateRubricTotal(currentPhase, rubricScores);

  function chooseSession(id: string) {
    setSessionId(id);
    const chosen = sessions.find((s) => s.id === id);
    const phase = (chosen?.phase ?? "R0") as ReviewPhase;
    const rubric = PHASE_RUBRICS[phase] ?? PHASE_RUBRICS.R0;
    const prior = byId.get(id);

    if (prior?.rubricScores && Object.keys(prior.rubricScores).length > 0) {
      setRubricScores(prior.rubricScores);
    } else {
      const resetScores: Record<string, number> = {};
      for (const c of rubric.criteria) {
        resetScores[c.id] = Math.round(c.maxScore * 0.8 * 10) / 10;
      }
      setRubricScores(resetScores);
    }

    setVerdict(prior?.verdict ?? "APPROVED");
    setRemarks(prior?.remarks ?? "");
    setActionItems(prior?.actionItems ?? "");

    const studentMap: Record<string, number> = {};
    if (prior?.studentScores) {
      for (const st of prior.studentScores) {
        studentMap[st.studentId] = st.score;
      }
    }
    setStudentMarks(studentMap);
  }

  function updateCriterion(id: string, val: number) {
    setRubricScores((prev) => ({
      ...prev,
      [id]: Math.round(val * 100) / 100,
    }));
  }

  function updateStudentMark(studentId: string, val: number) {
    setStudentMarks((prev) => ({
      ...prev,
      [studentId]: Math.round(val * 100) / 100,
    }));
  }

  async function save() {
    if (!sessionId) {
      toast({ tone: "warning", title: "Choose a session first." });
      return;
    }
    setBusy(true);
    try {
      const studentScoreArray = currentSession?.members?.map((m) => ({
        studentId: m.id,
        score: studentMarks[m.id] ?? computedTotal,
        remarks: undefined,
      })) ?? [];

      const res = await fetch("/api/evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          score: computedTotal,
          rubricScores,
          verdict,
          remarks: remarks.trim() || undefined,
          actionItems: actionItems.trim() || undefined,
          studentScores: studentScoreArray,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ tone: "error", title: "Could not save", description: data.error });
        return;
      }
      toast({
        tone: "success",
        title: `Rubric score ${computedTotal} / 10 saved!`,
        description: `Verdict: ${verdict}. Notifications sent to all group members.`,
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardBody>
          <EmptyState
            title="No review sessions assigned to evaluate"
            description="Sessions appear once reviews are scheduled for your groups."
          />
        </CardBody>
      </Card>
    );
  }

  const verdictConfig = getVerdictConfig(verdict);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Rubric-Based Evaluation Form"
          subtitle="Score multi-criteria project parameters, assess individual contributions, and assign action items."
          actions={
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowMarksheetModal(true)}
                icon={<Printer className="size-3.5" />}
              >
                Marksheet Preview
              </Button>
              <Button
                onClick={save}
                loading={busy}
                disabled={sessions.length === 0}
                icon={<Save className="size-3.5" aria-hidden />}
              >
                Save evaluation
              </Button>
            </div>
          }
        />
        <CardBody className="space-y-6">
          {/* Session Selector */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Select Review Session"
              value={sessionId}
              onChange={(e) => chooseSession(e.target.value)}
              wrapperClassName="sm:col-span-2"
            >
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {sessionLabel(session)} {byId.has(session.id) ? " · (Marked)" : ""}
                </option>
              ))}
            </Select>

            {/* Live Score Summary Banner */}
            <div className="flex flex-col justify-center rounded-xl border border-[#28265f]/20 bg-[#f8f8fc] p-3 text-center">
              <span className="text-xs font-semibold text-[#717182]">Calculated Total</span>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-2xl font-black text-[#28265f]">{computedTotal.toFixed(2)}</span>
                <span className="text-xs font-bold text-[#8e8f9e]">/ 10.0</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#e2e2e9]">
                <div
                  className="h-full bg-[#28265f] transition-all"
                  style={{ width: `${(computedTotal / 10) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Project Details Banner */}
          {currentSession && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e5e5ec] bg-[#fbfbfd] p-4 text-xs">
              <div>
                <span className="font-semibold text-[#717182]">Group Code: </span>
                <span className="mono font-bold text-[#28265f]">{currentSession.groupCode}</span>
                <span className="mx-2 text-[#ccc]">|</span>
                <span className="font-semibold text-[#717182]">Project Title: </span>
                <span className="font-medium text-[#1f2937]">{currentSession.projectTitle}</span>
              </div>
              <Badge tone="info">Phase: {currentPhase}</Badge>
            </div>
          )}

          {/* --- MULTI-CRITERIA RUBRIC CRITERIA SECTION --- */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Sliders className="size-4 text-[#28265f]" />
              <h3 className="text-sm font-bold text-[#242157]">{currentRubric.title} Rubric Breakdown</h3>
            </div>
            <p className="mb-4 text-xs text-[#717182]">{currentRubric.description}</p>

            <div className="space-y-4">
              {currentRubric.criteria.map((criterion) => {
                const currentVal = rubricScores[criterion.id] ?? 0;
                return (
                  <div
                    key={criterion.id}
                    className="rounded-xl border border-[#e2e2e9] bg-white p-4 transition-all hover:border-[#b6b7c4]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-sm font-bold text-[#28265f]">{criterion.name}</span>
                        <span className="ml-2 text-xs font-semibold text-[#717182]">
                          (Max: {criterion.maxScore} pts)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={criterion.maxScore}
                          step={0.25}
                          value={currentVal}
                          onChange={(e) => updateCriterion(criterion.id, parseFloat(e.target.value) || 0)}
                          className="h-8 w-18 rounded-lg border border-[#d8d9e2] px-2 text-center text-sm font-bold text-[#28265f] focus:border-[#28265f] focus:outline-none"
                        />
                        <span className="text-xs font-bold text-[#717182]">/ {criterion.maxScore}</span>
                      </div>
                    </div>

                    <p className="mt-1 text-xs text-[#555]">{criterion.description}</p>

                    {/* Interactive slider */}
                    <div className="mt-3 flex items-center gap-4">
                      <input
                        type="range"
                        min={0}
                        max={criterion.maxScore}
                        step={0.25}
                        value={currentVal}
                        onChange={(e) => updateCriterion(criterion.id, parseFloat(e.target.value))}
                        className="h-2 flex-1 cursor-pointer accent-[#28265f]"
                      />
                    </div>

                    {/* Indicator hints */}
                    <div className="mt-2 grid gap-1 border-t border-[#f0f0f5] pt-2 text-[0.68rem] text-[#888] sm:grid-cols-3">
                      {criterion.indicators.map((ind, idx) => (
                        <span key={idx} className="truncate" title={ind}>
                          • {ind}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* --- INDIVIDUAL STUDENT CONTRIBUTION MARKS --- */}
          {currentSession?.members && currentSession.members.length > 0 && (
            <div className="rounded-xl border border-[#e2e2e9] bg-[#fbfbfd] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Users className="size-4 text-[#28265f]" />
                <h3 className="text-sm font-bold text-[#242157]">Individual Student Contribution Marks</h3>
              </div>
              <p className="mb-3 text-xs text-[#717182]">
                Assign individual component scores if certain members contributed significantly above or below the group baseline.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#dedfe8] text-[#717182]">
                      <th className="pb-2 font-semibold">Student Name</th>
                      <th className="pb-2 font-semibold">USN</th>
                      <th className="pb-2 font-semibold text-right">Individual Score (/ 10)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f5]">
                    {currentSession.members.map((member) => (
                      <tr key={member.id}>
                        <td className="py-2.5 font-medium text-[#1f2937]">{member.fullName}</td>
                        <td className="py-2.5 mono text-[#717182]">{member.usn}</td>
                        <td className="py-2.5 text-right">
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.5}
                            value={studentMarks[member.id] ?? computedTotal}
                            onChange={(e) => updateStudentMark(member.id, parseFloat(e.target.value) || 0)}
                            className="h-7 w-20 rounded-md border border-[#d8d9e2] px-2 text-right text-xs font-bold text-[#28265f] focus:border-[#28265f] focus:outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- REVIEW VERDICT & OUTCOME --- */}
          <div className="rounded-xl border border-[#e2e2e9] bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <Award className="size-4 text-[#28265f]" />
              <h3 className="text-sm font-bold text-[#242157]">Review Verdict & Progression Decision</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["APPROVED", "NEEDS_REVISION", "EXCELLENT", "REJECTED"] as ReviewVerdict[]).map((v) => {
                const isSelected = verdict === v;
                const cfg = getVerdictConfig(v);
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVerdict(v)}
                    className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs font-bold transition-all ${
                      isSelected
                        ? "border-[#28265f] bg-[#28265f] text-white shadow-sm ring-2 ring-[#28265f]/20"
                        : `${cfg.bg} hover:opacity-80`
                    }`}
                  >
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* --- ACTION ITEMS & REMARKS --- */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Textarea
                label="Faculty Remarks & Qualitative Feedback"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Key strengths, conceptual understanding, and areas of excellence..."
                className="min-h-24 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Textarea
                label="Required Action Items & Rectification Tasks (Next Review)"
                value={actionItems}
                onChange={(e) => setActionItems(e.target.value)}
                placeholder="1. Refine dataset preprocessing pipeline&#10;2. Complete UML component diagram&#10;3. Add baseline benchmark comparisons"
                className="min-h-24 text-xs border-[#f0c7ca] focus:border-[#b9272f]"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* --- OFFICIAL MARKSHEET MODAL PREVIEW --- */}
      {showMarksheetModal && currentSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e5e5ec] pb-4">
              <div className="flex items-center gap-2">
                <FileCheck2 className="size-5 text-[#28265f]" />
                <h2 className="text-base font-bold text-[#242157]">Official Project Review Marksheet</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowMarksheetModal(false)}
                className="rounded-lg p-1 text-[#888] hover:bg-[#f0f0f5] hover:text-[#333]"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Marksheet Body with BMSIT Branding */}
            <div className="my-6 border border-[#28265f]/30 p-6">
              <div className="text-center">
                <h3 className="text-base font-black uppercase tracking-wide text-[#b9272f]">
                  BMS INSTITUTE OF TECHNOLOGY & MANAGEMENT
                </h3>
                <p className="text-xs font-bold text-[#28265f]">DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING</p>
                <p className="text-[0.7rem] text-[#666]">Yelahanka, Bengaluru — 560119</p>
                <div className="my-3 inline-block rounded border border-[#28265f] bg-[#f3f4f8] px-3 py-1 text-xs font-bold text-[#28265f]">
                  PROJECT REVIEW EVALUATION MARKSHEET — {currentPhase}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-y border-[#ddd] py-2">
                <div>
                  <span className="text-[#666]">Group Code:</span> <strong>{currentSession.groupCode}</strong>
                </div>
                <div>
                  <span className="text-[#666]">Review Date:</span> <strong>{DATE_TIME.format(new Date(currentSession.scheduledAt))}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-[#666]">Project Title:</span> <strong>{currentSession.projectTitle}</strong>
                </div>
              </div>

              {/* Rubric Breakdown Table */}
              <div className="mt-4">
                <h4 className="text-xs font-bold text-[#28265f]">Rubric Criteria Breakdown</h4>
                <table className="mt-1 w-full text-left text-xs border border-[#ddd]">
                  <thead className="bg-[#f5f5fa]">
                    <tr>
                      <th className="border p-2">Criterion</th>
                      <th className="border p-2 text-center">Max Marks</th>
                      <th className="border p-2 text-right">Awarded Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRubric.criteria.map((c) => (
                      <tr key={c.id}>
                        <td className="border p-2 font-medium">{c.name}</td>
                        <td className="border p-2 text-center text-[#666]">{c.maxScore}</td>
                        <td className="border p-2 text-right font-bold text-[#28265f]">
                          {(rubricScores[c.id] ?? 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-[#fbfbfd] font-bold">
                      <td className="border p-2 text-[#28265f]">TOTAL EVALUATION SCORE</td>
                      <td className="border p-2 text-center">10.0</td>
                      <td className="border p-2 text-right text-base text-[#28265f]">{computedTotal.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Verdict & Remarks */}
              <div className="mt-4 space-y-2 text-xs">
                <div>
                  <span className="text-[#666]">Progression Verdict:</span>{" "}
                  <strong className="text-[#28265f]">{verdictConfig.label}</strong>
                </div>
                {remarks && (
                  <div>
                    <span className="text-[#666]">Guide Remarks:</span> <p className="italic text-[#333]">{remarks}</p>
                  </div>
                )}
                {actionItems && (
                  <div>
                    <span className="font-bold text-[#b9272f]">Action Items:</span>{" "}
                    <p className="font-medium text-[#b9272f]">{actionItems}</p>
                  </div>
                )}
              </div>

              {/* Signature Line */}
              <div className="mt-10 flex justify-between pt-6 text-center text-xs text-[#555]">
                <div>
                  <div className="h-0.5 w-32 bg-[#bbb] mx-auto mb-1" />
                  <span>Student Representatives</span>
                </div>
                <div>
                  <div className="h-0.5 w-32 bg-[#bbb] mx-auto mb-1" />
                  <span>Faculty Guide Signature</span>
                </div>
                <div>
                  <div className="h-0.5 w-32 bg-[#bbb] mx-auto mb-1" />
                  <span>Coordinator / HOD</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowMarksheetModal(false)}>
                Close Preview
              </Button>
              <Button onClick={() => window.print()} icon={<Printer className="size-4" />}>
                Print Marksheet
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
