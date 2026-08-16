import type { ReviewPhase, ReviewVerdict } from "@/generated/prisma/enums";

export type RubricCriterion = {
  id: string;
  name: string;
  maxScore: number;
  description: string;
  indicators: string[];
};

export const PHASE_RUBRICS: Record<
  ReviewPhase,
  {
    title: string;
    description: string;
    criteria: RubricCriterion[];
  }
> = {
  R0: {
    title: "Review 0: Synopsis & Topic Defense",
    description: "Evaluation of problem clarity, literature survey, and feasibility of proposed scope.",
    criteria: [
      {
        id: "problem_definition",
        name: "Problem Definition & Novelty",
        maxScore: 2.5,
        description: "Clarity of the engineering problem, motivation, societal/industrial relevance, and novelty.",
        indicators: [
          "0.0–1.0: Vague problem, lack of engineering motivation",
          "1.1–1.8: Clear problem but standard/common application",
          "1.9–2.5: Well-defined, original engineering problem with strong relevance",
        ],
      },
      {
        id: "literature_survey",
        name: "Literature Survey & Background",
        maxScore: 2.5,
        description: "Comprehensiveness of cited IEEE/Scopus research papers, comparative analysis of existing systems.",
        indicators: [
          "0.0–1.0: Fewer than 3 papers, no comparative matrix",
          "1.1–1.8: 4–6 papers cited with basic comparison",
          "1.9–2.5: Comprehensive survey of 8+ recent peer-reviewed publications with gap identification",
        ],
      },
      {
        id: "methodology_scope",
        name: "Methodology & Proposed Architecture",
        maxScore: 2.5,
        description: "Proposed workflow, mathematical formulations, hardware/software stack feasibility.",
        indicators: [
          "0.0–1.0: Incomplete workflow, inappropriate tech stack",
          "1.1–1.8: Realistic approach, standard design",
          "1.9–2.5: Robust architecture, clear algorithmic flow, high feasibility",
        ],
      },
      {
        id: "presentation_qa",
        name: "Presentation & Viva Defense",
        maxScore: 2.5,
        description: "Slide quality, team coordination, depth of technical responses during Q&A.",
        indicators: [
          "0.0–1.0: Poor delivery, inability to defend topic",
          "1.1–1.8: Good presentation, handled basic questions",
          "1.9–2.5: Professional delivery, exemplary technical defense by all members",
        ],
      },
    ],
  },
  P1: {
    title: "Phase 1: Design & Mid-term Progress",
    description: "Detailed system architecture, module division, and preliminary prototype demonstration.",
    criteria: [
      {
        id: "architecture_design",
        name: "System Architecture & UML Modeling",
        maxScore: 2.5,
        description: "Complete UML diagrams (DFD, Sequence, Class/Component), database schema normalisation.",
        indicators: [
          "0.0–1.0: Missing or inaccurate architectural diagrams",
          "1.1–1.8: Standard UML models, mostly consistent schema",
          "1.9–2.5: Comprehensive, verified architectural and modular specifications",
        ],
      },
      {
        id: "module_division",
        name: "Module Division & Team Allocation",
        maxScore: 2.5,
        description: "Clear division of individual responsibilities, milestones, Git repo commits and branch management.",
        indicators: [
          "0.0–1.0: Unclear individual responsibilities, single-member bottleneck",
          "1.1–1.8: Defined modules, regular git commits",
          "1.9–2.5: Balanced workload distribution with active collaborative version control",
        ],
      },
      {
        id: "prototype_progress",
        name: "Prototype & Core Logic Progress",
        maxScore: 2.5,
        description: "Working implementation of core algorithm / foundational database and API pipelines (30–50% complete).",
        indicators: [
          "0.0–1.0: Only UI mockups, zero working backend or algorithms",
          "1.1–1.8: Partial backend functional, initial module integrated",
          "1.9–2.5: Working functional prototype demonstrating core algorithms successfully",
        ],
      },
      {
        id: "midterm_report",
        name: "Phase 1 Documentation & Defense",
        maxScore: 2.5,
        description: "Interim report adhering to IEEE format, references, code documentation, and guide interactions.",
        indicators: [
          "0.0–1.0: Substandard formatting, missing chapters",
          "1.1–1.8: Good report adhering to guidelines",
          "1.9–2.5: Rigorous documentation, complete appendices, flawless defense",
        ],
      },
    ],
  },
  P2: {
    title: "Phase 2: Final Implementation & Defense",
    description: "Full system demonstration, performance benchmarks, testing, and final project report.",
    criteria: [
      {
        id: "implementation_quality",
        name: "Implementation Completeness & Code Quality",
        maxScore: 3.0,
        description: "100% completion of committed scope, code modularity, adherence to security best practices, error handling.",
        indicators: [
          "0.0–1.2: Incomplete features, brittle code, lack of validation",
          "1.3–2.2: Full functional scope with standard quality",
          "2.3–3.0: Production-grade architecture, optimal algorithmic complexity, robust error handling",
        ],
      },
      {
        id: "results_analysis",
        name: "Results, Benchmarks & Validation",
        maxScore: 2.5,
        description: "Empirical evaluation (accuracy, latency, throughput, user testing, comparative analysis with baseline).",
        indicators: [
          "0.0–1.0: No quantitative results, subjective claims only",
          "1.1–1.8: Basic metrics reported with simple charts",
          "1.9–2.5: Rigorous statistical benchmarks, confusion matrices, ablation studies",
        ],
      },
      {
        id: "live_demonstration",
        name: "Live System Demo & Viva Voce",
        maxScore: 2.5,
        description: "Real-time edge-case testing, individual code walkthrough, in-depth defense of architectural choices.",
        indicators: [
          "0.0–1.0: Demo crashes or failed test cases",
          "1.1–1.8: Smooth standard demo",
          "1.9–2.5: Flawless demo handling live stress test cases and deep cross-questioning",
        ],
      },
      {
        id: "final_report",
        name: "Final Project Thesis & Plagiarism Report",
        maxScore: 2.0,
        description: "Complete final thesis, publication manuscript (if applicable), similarity index below 15%.",
        indicators: [
          "0.0–0.8: Incomplete thesis, high similarity",
          "0.9–1.4: Well-formatted report meeting department standards",
          "1.5–2.0: Publication-worthy thesis with verified originality report",
        ],
      },
    ],
  },
};

/**
 * Calculates the total score out of 10.0 based on criteria scores.
 */
export function calculateRubricTotal(
  phase: ReviewPhase,
  scores: Record<string, number>,
): number {
  const rubric = PHASE_RUBRICS[phase];
  if (!rubric) return 0;

  let total = 0;
  for (const criterion of rubric.criteria) {
    const rawVal = scores[criterion.id];
    if (typeof rawVal === "number" && !Number.isNaN(rawVal)) {
      const clamped = Math.max(0, Math.min(criterion.maxScore, rawVal));
      total += clamped;
    }
  }

  return Math.round(total * 100) / 100;
}

/**
 * Returns user-friendly badge styles for review verdict.
 */
export function getVerdictConfig(verdict: ReviewVerdict | string = "APPROVED") {
  switch (verdict) {
    case "EXCELLENT":
      return {
        label: "Excellent (Distinction)",
        bg: "bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]",
        iconColor: "text-[#059669]",
      };
    case "APPROVED":
      return {
        label: "Approved & Progressing",
        bg: "bg-[#eff6ff] text-[#1e40af] border-[#bfdbfe]",
        iconColor: "text-[#2563eb]",
      };
    case "NEEDS_REVISION":
      return {
        label: "Revision Required",
        bg: "bg-[#fffbeb] text-[#92400e] border-[#fde68a]",
        iconColor: "text-[#d97706]",
      };
    case "REJECTED":
      return {
        label: "Unsatisfactory / Re-Review",
        bg: "bg-[#fef2f2] text-[#991b1b] border-[#fecaca]",
        iconColor: "text-[#dc2626]",
      };
    default:
      return {
        label: "Evaluated",
        bg: "bg-[#f3f4f8] text-[#333] border-[#e2e2e9]",
        iconColor: "text-[#666]",
      };
  }
}
