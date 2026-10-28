import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("=== Seeding Presentation Demo Data (10 Mock Groups) ===");

  // 1. Get active cycle
  const activeCycle =
    (await prisma.projectCycle.findFirst({ where: { isActive: true } })) ||
    (await prisma.projectCycle.findFirst({ orderBy: { createdAt: "desc" } }));

  if (!activeCycle) {
    throw new Error("No active ProjectCycle found.");
  }
  console.log(`Active Cycle: ${activeCycle.name} (${activeCycle.code})`);

  // 2. Fetch all real students
  const students = await prisma.student.findMany({
    orderBy: { usn: "asc" },
    include: { user: true },
  });
  console.log(`Found ${students.length} real students in database.`);

  const studentByUsn = new Map(students.map((s) => [s.usn.toUpperCase(), s]));

  // 3. Fetch faculty
  const facultyList = await prisma.faculty.findMany({
    include: { user: true, domains: true },
  });
  const facultyByEmail = new Map(facultyList.map((f) => [f.email.toLowerCase(), f]));

  // 4. Fetch domains
  const domainList = await prisma.domain.findMany();
  const domainByName = new Map(domainList.map((d) => [d.name.toLowerCase(), d]));

  // Helper to find domain
  function getDomain(namePart: string) {
    const key = Object.keys(Object.fromEntries(domainByName)).find((k) =>
      k.includes(namePart.toLowerCase())
    );
    return key ? domainByName.get(key) : domainList[0];
  }

  // 5. Clean up any existing groups in this cycle to avoid duplicate codes
  console.log("Cleaning up prior groups in active cycle...");
  const existingGroups = await prisma.group.findMany({
    where: { cycleId: activeCycle.id },
    select: { id: true },
  });
  const groupIds = existingGroups.map((g) => g.id);

  if (groupIds.length > 0) {
    await prisma.studentScore.deleteMany({
      where: { evaluation: { groupId: { in: groupIds } } },
    });
    await prisma.evaluation.deleteMany({ where: { groupId: { in: groupIds } } });
    await prisma.attendance.deleteMany({
      where: { session: { groupId: { in: groupIds } } },
    });
    await prisma.reviewSession.deleteMany({ where: { groupId: { in: groupIds } } });
    await prisma.allocation.deleteMany({ where: { groupId: { in: groupIds } } });
    await prisma.guidePreference.deleteMany({ where: { groupId: { in: groupIds } } });
    await prisma.projectTitle.deleteMany({ where: { groupId: { in: groupIds } } });
    await prisma.groupInvite.deleteMany({ where: { groupId: { in: groupIds } } });
    await prisma.groupMember.deleteMany({ where: { groupId: { in: groupIds } } });
    await prisma.group.deleteMany({ where: { id: { in: groupIds } } });
    console.log("Prior groups wiped clean.");
  }

  // Get Karri Uday Admin User for reviewer attribution
  const adminUser =
    (await prisma.user.findFirst({ where: { email: "karri.uday@bmsit.in" } })) ||
    (await prisma.user.findFirst({ where: { role: "ADMIN" } }));

  // Definition of the 10 Demo Groups
  const groupConfigs = [
    {
      code: "GRP-2025-01",
      domainSlug: "ai",
      status: "ALLOCATED" as const,
      leaderUsn: "1BY23CS098", // Karri Uday
      memberUsns: ["1BY24CS003", "1BY24CS028", "1BY24CS030"], // Abhay, Arjun, Aryan
      title: "Federated Learning Framework for Privacy-Preserving Healthcare Diagnostics",
      problemStatement: "Centralized medical databases risk patient privacy compliance. This system orchestrates edge-trained differential privacy models across distributed hospital nodes.",
      guidePreferences: ["dhanalakshmi.bk@bmsit.in", "veena.n@bmsit.in", "shankar.r@bmsit.in"],
      allocatedGuideEmail: "dhanalakshmi.bk@bmsit.in",
      titleApproved: true,
      hasEvaluations: true,
      scoreP1: 9.2,
      feedback: "Rigorous mathematical formulation of client-side differential privacy. Benchmark dataset verification is well planned.",
    },
    {
      code: "GRP-2025-02",
      domainSlug: "cyber",
      status: "ALLOCATED" as const,
      leaderUsn: "1BY23CS062", // Drishya Singh
      memberUsns: ["1BY24CS046", "1BY24CS047", "1BY24CS048"], // Bhuvi, Brinda R, Brinda Suresh
      title: "Zero-Trust Microsegmentation and Dynamic Anomaly Detection in Kubernetes Clusters",
      problemStatement: "Container sprawl creates lateral attack surfaces. We implement eBPF kernel probes with behavioral graph heuristics to enforce identity-aware service policies.",
      guidePreferences: ["veena.n@bmsit.in", "packya.lekshmi@bmsit.in", "arpitha.s@bmsit.in"],
      allocatedGuideEmail: "veena.n@bmsit.in",
      titleApproved: true,
      hasEvaluations: true,
      scoreP1: 8.8,
      feedback: "Strong eBPF probe telemetry architecture. Ensure synthetic network attack benchmarks are documented.",
    },
    {
      code: "GRP-2025-03",
      domainSlug: "nlp",
      status: "ALLOCATED" as const,
      leaderUsn: "1BY25CS410", // Ankitha
      memberUsns: ["1BY25CS413", "1BY24CS090", "1BY24CS096"], // Ashwini, Gautham, Gorla Komal
      title: "Multilingual Retrieval-Augmented Generation (RAG) for Rural Legal Aid Assistance",
      problemStatement: "Statutory legal information is inaccessible in vernacular dialects. This architecture provides cross-lingual dense semantic search with verified source attribution.",
      guidePreferences: ["shankar.r@bmsit.in", "arpitha.s@bmsit.in", "veena.n@bmsit.in"],
      allocatedGuideEmail: "shankar.r@bmsit.in",
      titleApproved: true,
      hasEvaluations: true,
      scoreP1: 8.9,
      feedback: "Novel retrieval re-ranking mechanism for low-resource Indian languages. Prototype demo was impressive.",
    },
    {
      code: "GRP-2025-04",
      domainSlug: "iot",
      status: "ALLOCATED" as const,
      leaderUsn: "1BY23CS113", // M Hemanth Raj
      memberUsns: ["1BY24CS104", "1BY24CS113", "1BY24CS114"], // Harshitha, Jatin, Jeevika
      title: "Solar-Powered LoRaWAN Sensor Mesh for Early Forest Fire Localization",
      problemStatement: "Wildfire spread causes catastrophic ecological damage. We deploy sub-gigahertz LoRa sensor nodes running on-device TinyML fire-index estimators.",
      guidePreferences: ["mahesh.g@bmsit.in", "veena.n@bmsit.in", "chaitanya.v@bmsit.in"],
      allocatedGuideEmail: "mahesh.g@bmsit.in",
      titleApproved: true,
      hasEvaluations: true,
      scoreP1: 8.6,
      feedback: "Hardware prototype battery life validation and link-budget analysis meet IEEE requirements.",
    },
    {
      code: "GRP-2025-05",
      domainSlug: "image",
      status: "ALLOCATED" as const,
      leaderUsn: "1BY25CS403", // Aishwarya
      memberUsns: ["1BY24CS118", "1BY24CS139", "1BY24CS167"], // K P Somaiah, Lekhana, Mohammed Akhil
      title: "Real-Time Embedded Vision System for Driver Fatigue & Gaze Distraction Mitigation",
      problemStatement: "Commercial driver fatigue is the primary cause of highway collisions. We design an edge-deployable MobileNet-V4 pipeline monitoring micro-saccades.",
      guidePreferences: ["anusha.kl@bmsit.in", "dhanalakshmi.bk@bmsit.in", "renita@bmsit.in"],
      allocatedGuideEmail: "anusha.kl@bmsit.in",
      titleApproved: true,
      hasEvaluations: true,
      scoreP1: 9.1,
      feedback: "High FPS inference on Jetson Nano demonstrated. Infrared low-light performance is commendable.",
    },
    {
      code: "GRP-2025-06",
      domainSlug: "cloud",
      status: "ALLOCATED" as const,
      leaderUsn: "1BY25CS404", // Akash S Suragimath
      memberUsns: ["1BY24CS193", "1BY24CS195", "1BY24CS201"], // P Nikhil, Parth, Polineni
      title: "Predictive Cold-Start Mitigation in Serverless FaaS via Reinforcement Learning",
      problemStatement: "Ephemeral container instantiation incurs latency spikes in event-driven systems. We train a deep Q-learning policy to pre-warm function sandboxes.",
      guidePreferences: ["mohammed.khurram@bmsit.in", "dhanalakshmi.bk@bmsit.in", "shilpa.m@bmsit.in"],
      allocatedGuideEmail: "mohammed.khurram@bmsit.in",
      titleApproved: true,
      hasEvaluations: false,
      scoreP1: 0,
      feedback: "",
    },
    {
      code: "GRP-2025-07",
      domainSlug: "data",
      status: "ALLOCATED" as const,
      leaderUsn: "1BY24CS252", // Samyuktha G Gowda
      memberUsns: ["1BY24CS202", "1BY24CS204", "1BY24CS207"], // Poojalakshmi, Prabhjot, Prajna
      title: "Temporal Graph Neural Networks for High-Frequency Crypto Laundering Ring Detection",
      problemStatement: "Complex mixing pools obscure illicit on-chain transaction flows. We construct dynamic bipartite interaction graphs with spectral community mining.",
      guidePreferences: ["packya.lekshmi@bmsit.in", "gowthami@bmsit.in", "arpitha.s@bmsit.in"],
      allocatedGuideEmail: "packya.lekshmi@bmsit.in",
      titleApproved: true,
      hasEvaluations: false,
      scoreP1: 0,
      feedback: "",
    },
    {
      code: "GRP-2025-08",
      domainSlug: "web",
      status: "SUBMITTED" as const, // Ready for Gale-Shapley live run demonstration!
      leaderUsn: "1BY24CS287", // Srushti Anilkumar Shellikeri
      memberUsns: ["1BY24CS220", "1BY24CS243", "1BY24CS335"], // R Manas, Sachith, Vijeth
      title: "Decentralized Peer-to-Peer Renewable Microgrid Energy Settlement on Arbitrum",
      problemStatement: "Prosumer solar grids lack transparent micropayment settlement. We build an automated market-maker smart contract protocol with zero-knowledge meter proofs.",
      guidePreferences: ["shilpa.m@bmsit.in", "shankar.r@bmsit.in", "mahesh.g@bmsit.in"],
      allocatedGuideEmail: null,
      titleApproved: true,
      hasEvaluations: false,
      scoreP1: 0,
      feedback: "",
    },
    {
      code: "GRP-2025-09",
      domainSlug: "ai",
      status: "SUBMITTED" as const, // For showing Faculty Title Approval flow!
      leaderUsn: "1BY25CS406", // Aliyan Abdulraheem Mulla
      memberUsns: ["1TD24CS049", "1TD24CS066", "1TD24CS067"], // C M Kalyan, Dhanik, Dinesh
      title: "Automated Sub-Micron Wafer Surface Flaw Segmentation with Vision Transformers",
      problemStatement: "Semiconductor yield loss stems from microscopic silicon defects. This project fine-tunes self-supervised masked autoencoders on cleanroom SEM imagery.",
      guidePreferences: ["dhanalakshmi.bk@bmsit.in", "mahesh.g@bmsit.in", "vinutha.k@bmsit.in"],
      allocatedGuideEmail: null,
      titleApproved: false, // PENDING
      hasEvaluations: false,
      scoreP1: 0,
      feedback: "",
    },
    {
      code: "GRP-2025-10",
      domainSlug: "cyber",
      status: "FORMING" as const, // For showing live student group formation and team invites!
      leaderUsn: "1TD24CS028", // Asha S
      memberUsns: ["1TD24CS060"], // Darshini P (2 members, needs more)
      title: "Automated Firmware Vulnerability Triage through Static Binary Emulation",
      problemStatement: "IoT device firmwares rarely publish source code. We develop a headless QEMU fuzzer with symbolic taint tracking.",
      guidePreferences: [],
      allocatedGuideEmail: null,
      titleApproved: false,
      hasEvaluations: false,
      scoreP1: 0,
      feedback: "",
    },
  ];

  let groupsCreated = 0;

  for (const cfg of groupConfigs) {
    const leader = studentByUsn.get(cfg.leaderUsn.toUpperCase());
    if (!leader) {
      console.warn(`Leader with USN ${cfg.leaderUsn} not found, skipping.`);
      continue;
    }

    const domain = getDomain(cfg.domainSlug);

    // Create Group
    const group = await prisma.group.create({
      data: {
        cycleId: activeCycle.id,
        code: cfg.code,
        status: cfg.status,
        domainId: domain?.id,
        leaderId: leader.id,
        avgCgpa: 8.65,
        prefsSubmittedAt: cfg.guidePreferences.length > 0 ? new Date() : null,
        lockedAt: cfg.status === "ALLOCATED" ? new Date() : null,
      },
    });

    // Add Leader as Member
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        studentId: leader.id,
        cycleId: activeCycle.id,
        role: "LEADER",
      },
    });

    // Add other Members
    for (const memberUsn of cfg.memberUsns) {
      const mem = studentByUsn.get(memberUsn.toUpperCase());
      if (mem) {
        await prisma.groupMember.create({
          data: {
            groupId: group.id,
            studentId: mem.id,
            cycleId: activeCycle.id,
            role: "MEMBER",
          },
        });
      }
    }

    // For Group 10 (FORMING), create a pending invite to Keerthana S
    if (cfg.code === "GRP-2025-10") {
      const inviteTarget = studentByUsn.get("1TD24CS113");
      if (inviteTarget) {
        await prisma.groupInvite.create({
          data: {
            groupId: group.id,
            cycleId: activeCycle.id,
            fromStudentId: leader.id,
            toStudentId: inviteTarget.id,
            status: "PENDING",
            message: "Hey Keerthana, please join our Firmware Fuzzing project team!",
            expiresAt: new Date(Date.now() + 7 * 86400000),
          },
        });
      }
    }

    // Project Title
    const guideReviewer = cfg.allocatedGuideEmail
      ? facultyByEmail.get(cfg.allocatedGuideEmail.toLowerCase())
      : null;

    await prisma.projectTitle.create({
      data: {
        cycleId: activeCycle.id,
        groupId: group.id,
        title: cfg.title,
        normalizedTitle: cfg.title.toLowerCase().replace(/[^a-z0-9\s]/g, " "),
        problemStatement: cfg.problemStatement,
        domainId: domain?.id,
        source: "STUDENT_SUBMISSION",
        approvalStatus: cfg.titleApproved
          ? "APPROVED"
          : cfg.code === "GRP-2025-09"
          ? "PENDING"
          : "DRAFT",
        similarityScore: 0.1425,
        similarityReport: {
          lexical: 0.12,
          semantic: 0.165,
          topMatch: "IoT Device Anomaly Detection (2024 Archive)",
          verdict: "Original Idea - Safe to Proceed",
        },
        reviewedById: cfg.titleApproved ? guideReviewer?.userId || adminUser?.id : null,
        reviewedAt: cfg.titleApproved ? new Date() : null,
      },
    });

    // Guide Preferences
    let rank = 1;
    for (const fEmail of cfg.guidePreferences) {
      const fac = facultyByEmail.get(fEmail.toLowerCase());
      if (fac) {
        await prisma.guidePreference.create({
          data: {
            groupId: group.id,
            facultyId: fac.id,
            rank,
          },
        });
        rank++;
      }
    }

    // Allocation
    if (cfg.allocatedGuideEmail) {
      const allocatedFaculty = facultyByEmail.get(cfg.allocatedGuideEmail.toLowerCase());
      if (allocatedFaculty) {
        await prisma.allocation.create({
          data: {
            cycleId: activeCycle.id,
            groupId: group.id,
            facultyId: allocatedFaculty.id,
            matchedRank: 1,
            method: "GALE_SHAPLEY",
            status: "ALLOCATED",
            assignedById: adminUser?.id,
          },
        });
      }
    }

    // Review Sessions & Evaluations
    if (cfg.hasEvaluations && cfg.allocatedGuideEmail) {
      const faculty = facultyByEmail.get(cfg.allocatedGuideEmail.toLowerCase());
      const allGroupMembers = await prisma.groupMember.findMany({
        where: { groupId: group.id },
      });

      // Review 0 (R0) - Idea Scope Review (Completed)
      const r0Session = await prisma.reviewSession.create({
        data: {
          cycleId: activeCycle.id,
          groupId: group.id,
          facultyId: faculty?.id,
          phase: "R0",
          scheduledAt: new Date(Date.now() - 14 * 86400000),
          venue: "Seminar Hall 1",
          durationMinutes: 20,
          status: "COMPLETED",
          notes: "Problem statement validated and approved for development.",
        },
      });

      // Mark R0 Attendance
      for (const m of allGroupMembers) {
        await prisma.attendance.create({
          data: {
            sessionId: r0Session.id,
            studentId: m.studentId,
            status: "PRESENT",
            markedById: faculty?.userId || adminUser?.id!,
          },
        });
      }

      // Review 1 (P1) - Architecture & Rubric Evaluation (Completed)
      const p1Session = await prisma.reviewSession.create({
        data: {
          cycleId: activeCycle.id,
          groupId: group.id,
          facultyId: faculty?.id,
          phase: "P1",
          scheduledAt: new Date(Date.now() - 4 * 86400000),
          venue: "Project Lab 301",
          durationMinutes: 25,
          status: "COMPLETED",
          notes: "System architecture and component specifications evaluated.",
        },
      });

      // Mark P1 Attendance
      for (const m of allGroupMembers) {
        await prisma.attendance.create({
          data: {
            sessionId: p1Session.id,
            studentId: m.studentId,
            status: "PRESENT",
            markedById: faculty?.userId || adminUser?.id!,
          },
        });
      }

      // Evaluation record for P1
      if (faculty) {
        const evaluation = await prisma.evaluation.create({
          data: {
            sessionId: p1Session.id,
            groupId: group.id,
            facultyId: faculty.id,
            score: cfg.scoreP1,
            remarks: cfg.feedback,
            verdict: "APPROVED",
            rubricScores: {
              literatureSurvey: 9.0,
              problemFormulation: 9.0,
              architectureDesign: 9.5,
              implementationProgress: 9.0,
              presentationQnA: 9.5,
            },
            actionItems: "Incorporate benchmark latency tests before Review 2 demonstration.",
          },
        });

        // Individual student scores
        for (const m of allGroupMembers) {
          await prisma.studentScore.create({
            data: {
              evaluationId: evaluation.id,
              studentId: m.studentId,
              score: cfg.scoreP1,
              remarks: "Active contribution in system design and defense.",
            },
          });
        }
      }

      // Review 2 (P2) - Scheduled for upcoming presentation!
      await prisma.reviewSession.create({
        data: {
          cycleId: activeCycle.id,
          groupId: group.id,
          facultyId: faculty?.id,
          phase: "P2",
          scheduledAt: new Date(Date.now() + 2 * 86400000), // In 2 days
          venue: "Project Lab 301",
          durationMinutes: 30,
          status: "SCHEDULED",
          notes: "Mid-term demonstration of modules and code review.",
        },
      });
    }

    groupsCreated++;
  }

  // Create an AllocationRun record so /admin/allocation displays match statistics
  if (adminUser) {
    await prisma.allocationRun.create({
      data: {
        cycleId: activeCycle.id,
        triggeredById: adminUser.id,
        isDryRun: false,
        groupsConsidered: 8,
        facultyConsidered: 21,
        allocatedCount: 7,
        unallocatedCount: 1,
        params: {
          algorithm: "Gale-Shapley (Stable Marriage)",
          tieBreakRule: "CGPA_DESC",
          quotaPerFaculty: 2,
        },
      },
    });
  }

  console.log(`Successfully created ${groupsCreated} realistic demo groups!`);

  // Verification counts
  const totalGroups = await prisma.group.count({ where: { cycleId: activeCycle.id } });
  const allocatedGroups = await prisma.group.count({
    where: { cycleId: activeCycle.id, status: "ALLOCATED" },
  });
  const titles = await prisma.projectTitle.count({ where: { cycleId: activeCycle.id } });
  const reviews = await prisma.reviewSession.count({ where: { cycleId: activeCycle.id } });
  const evaluations = await prisma.evaluation.count();

  console.log("=== Demo Environment Verification ===");
  console.log(`Groups in Cycle: ${totalGroups}`);
  console.log(`Allocated Groups: ${allocatedGroups}`);
  console.log(`Titles Created: ${titles}`);
  console.log(`Review Sessions: ${reviews}`);
  console.log(`Evaluations Logged: ${evaluations}`);
}

main()
  .catch((e) => {
    console.error("Presentation seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
