/**
 * Demo data for Campus Here.
 *
 * Deterministic: every random choice comes from a seeded PRNG, so two runs on
 * the same code produce the same cohort and screenshots stay reproducible.
 *
 * Addresses are @example.edu on purpose — this repository is public, so no
 * real student's address is committed. The Mail Center's live test recipient
 * comes from the uncommitted DEMO_STUDENT_EMAIL instead.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import {
  buildCorpusIndex,
  checkTitle,
  normalizeTitle,
  type CorpusEntry,
} from "../src/server/services/similarity";
import { DOMAINS, FACULTY, FIRST_NAMES, LAST_NAMES, VENUES } from "./seed-data/people";
import { CURRENT_TITLES, TITLE_CORPUS } from "./seed-data/titles";

// --- deterministic randomness ---------------------------------------------

function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(20260807);
const pick = <T>(items: T[]): T => items[Math.floor(random() * items.length)];
const between = (min: number, max: number) => min + random() * (max - min);

const DAY_MS = 24 * 60 * 60 * 1000;
const now = new Date();
const daysFromNow = (days: number) => new Date(now.getTime() + days * DAY_MS);

/** 09:00 local on (date - offset days) — the reminder dispatch convention. */
function reminderDueAt(eventDate: Date, offsetDays: number) {
  const due = new Date(eventDate.getTime() - offsetDays * DAY_MS);
  due.setHours(9, 0, 0, 0);
  return due;
}

// --- cohort sizing ---------------------------------------------------------

const STUDENT_COUNT = 300;
const ALLOCATED_GROUPS = 30;
const SUBMITTED_GROUPS = 25;
const READY_GROUPS = 10;
const FORMING_GROUPS = 6;

async function resetDatabase() {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  if (tables.length === 0) return;
  const list = tables.map((t) => `"public"."${t.tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`,
  );
}

async function main() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.SEED_ALLOW_PRODUCTION !== "true"
  ) {
    throw new Error(
      "Refusing to seed with NODE_ENV=production. This wipes every table. " +
        "Set SEED_ALLOW_PRODUCTION=true only if that is genuinely intended.",
    );
  }

  console.log("Clearing existing data…");
  await resetDatabase();

  // One bcrypt round for the shared demo password, reused for every account —
  // hashing 340 users individually would take over a minute for no benefit.
  const password = process.env.SEED_PASSWORD ?? "Campus@123";
  const passwordHash = await bcrypt.hash(password, 12);

  // --- cycles -------------------------------------------------------------
  const cycles = await Promise.all(
    [
      { code: "2025-26-major", name: "2025–26 · Major Projects", isActive: true },
      { code: "2025-26-mini", name: "2025–26 · Mini Projects", isActive: false },
      { code: "2025-26-intern", name: "2025–26 · Internships", isActive: false },
    ].map((cycle) =>
      prisma.projectCycle.create({
        data: {
          ...cycle,
          groupSize: 4,
          prefCount: 6,
          startDate: daysFromNow(-120),
          endDate: daysFromNow(120),
        },
      }),
    ),
  );
  const major = cycles[0];
  console.log(`  ${cycles.length} project cycles`);

  // --- master data --------------------------------------------------------
  const domains = await Promise.all(
    DOMAINS.map((domain, index) =>
      prisma.domain.create({ data: { ...domain, sortOrder: index } }),
    ),
  );
  const domainByName = new Map(domains.map((d) => [d.name, d]));

  await prisma.capacityRule.createMany({
    data: [
      { designation: "ASSISTANT_PROFESSOR", maxGroups: 2 },
      { designation: "ASSOCIATE_PROFESSOR", maxGroups: 2 },
      { designation: "PROFESSOR", maxGroups: 2 },
    ],
  });
  console.log(`  ${domains.length} domains, 3 capacity rules`);

  // --- admin --------------------------------------------------------------
  const admin = await prisma.user.create({
    data: {
      email: "admin@example.edu",
      passwordHash,
      role: "ADMIN",
      name: "Project Coordinator",
    },
  });

  // --- faculty ------------------------------------------------------------
  const faculty = [];
  for (const [index, entry] of FACULTY.entries()) {
    const slug = entry.fullName
      .replace(/^(Dr|Prof|Mr|Ms)\.?\s+/i, "")
      .toLowerCase()
      .replace(/[^a-z]+/g, ".");
    const record = await prisma.faculty.create({
      data: {
        fullName: entry.fullName,
        email: `${slug}@example.edu`,
        employeeId: `CSE-F-${String(index + 1).padStart(3, "0")}`,
        designation: entry.designation,
        capacity: 2,
        phone: `+9198${String(45000000 + index * 137).padStart(8, "0")}`,
        domains: {
          connect: entry.domains
            .map((name) => domainByName.get(name))
            .filter((d) => d !== undefined)
            .map((d) => ({ id: d.id })),
        },
        user: {
          create: {
            email: `${slug}@example.edu`,
            passwordHash,
            role: "FACULTY",
            name: entry.fullName,
          },
        },
      },
      include: { domains: true },
    });
    faculty.push(record);
  }
  console.log(`  ${faculty.length} faculty`);

  // --- students -----------------------------------------------------------
  const students = [];
  const usedEmails = new Set<string>();
  for (let i = 1; i <= STUDENT_COUNT; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const usn = `1BY23CS${String(i).padStart(3, "0")}`;
    let email = `${first}.${last}${i}`.toLowerCase().replace(/[^a-z0-9.]/g, "");
    email = `${email}@example.edu`;
    if (usedEmails.has(email)) email = `${usn.toLowerCase()}@example.edu`;
    usedEmails.add(email);

    students.push({
      usn,
      fullName: `${first} ${last}`,
      email,
      cgpa: Math.round(between(6.0, 9.9) * 100) / 100,
      phone: `+9199${String(10000000 + i * 371).padStart(8, "0")}`,
    });
  }

  // createMany cannot create the paired User rows, so these go one at a time.
  const studentRecords = [];
  for (const student of students) {
    const record = await prisma.student.create({
      data: {
        ...student,
        user: {
          create: {
            email: student.email,
            passwordHash,
            role: "STUDENT",
            name: student.fullName,
          },
        },
        enrollments: { create: { cycleId: major.id } },
      },
    });
    studentRecords.push(record);
  }
  console.log(`  ${studentRecords.length} students enrolled in ${major.name}`);

  // --- title corpus -------------------------------------------------------
  await prisma.projectTitle.createMany({
    data: TITLE_CORPUS.map((entry) => ({
      cycleId: major.id,
      title: entry.title,
      normalizedTitle: normalizeTitle(entry.title),
      domainId: domainByName.get(entry.domain)?.id ?? null,
      domainLabel: entry.domain,
      guideLabel: entry.guide,
      cycleLabel: entry.cycle,
      source: "IMPORTED_CORPUS" as const,
      approvalStatus: "APPROVED" as const,
    })),
  });
  console.log(`  ${TITLE_CORPUS.length} corpus titles`);

  // --- groups -------------------------------------------------------------
  // Highest CGPA first, so the merit ordering the allocation engine relies on
  // is visible in the seeded data too.
  const pool = [...studentRecords].sort(
    (a, b) => Number(b.cgpa) - Number(a.cgpa),
  );
  let cursor = 0;
  let groupNumber = 0;

  type SeededGroup = Awaited<ReturnType<typeof prisma.group.create>>;
  const allocatedGroups: SeededGroup[] = [];
  const submittedGroups: SeededGroup[] = [];

  async function createGroup(memberCount: number, status: "FORMING" | "READY" | "SUBMITTED" | "ALLOCATED") {
    groupNumber += 1;
    const members = pool.slice(cursor, cursor + memberCount);
    cursor += memberCount;
    if (members.length < memberCount) return null;

    const avgCgpa =
      Math.round(
        (members.reduce((sum, m) => sum + Number(m.cgpa), 0) / members.length) *
          100,
      ) / 100;
    const domain = pick(domains);
    const needsDetail = status === "SUBMITTED" || status === "ALLOCATED";

    return prisma.group.create({
      data: {
        cycleId: major.id,
        code: `CSE6-A-${String(groupNumber).padStart(3, "0")}`,
        status,
        avgCgpa,
        domainId: needsDetail || status === "READY" ? domain.id : null,
        leaderId: members[0].id,
        prefsSubmittedAt: needsDetail ? daysFromNow(-Math.floor(between(5, 30))) : null,
        lockedAt: needsDetail ? daysFromNow(-Math.floor(between(5, 30))) : null,
        members: {
          create: members.map((member, index) => ({
            studentId: member.id,
            cycleId: major.id,
            role: index === 0 ? ("LEADER" as const) : ("MEMBER" as const),
          })),
        },
      },
    });
  }

  for (let i = 0; i < ALLOCATED_GROUPS; i++) {
    const group = await createGroup(4, "ALLOCATED");
    if (group) allocatedGroups.push(group);
  }
  for (let i = 0; i < SUBMITTED_GROUPS; i++) {
    const group = await createGroup(4, "SUBMITTED");
    if (group) submittedGroups.push(group);
  }
  for (let i = 0; i < READY_GROUPS; i++) await createGroup(4, "READY");
  for (let i = 0; i < FORMING_GROUPS; i++) await createGroup(3, "FORMING");

  const groupedCount = cursor;
  console.log(
    `  ${groupNumber} groups (${ALLOCATED_GROUPS} allocated, ${SUBMITTED_GROUPS} submitted, ` +
      `${READY_GROUPS} ready, ${FORMING_GROUPS} forming); ${STUDENT_COUNT - groupedCount} students still unattached`,
  );

  // --- guide preferences --------------------------------------------------
  // Groups that have submitted rank six guides. Preferences are skewed towards
  // guides who share the group's domain, which is what makes the allocation
  // run produce a genuine unallocated queue rather than a trivial matching.
  const detailedGroups = [...allocatedGroups, ...submittedGroups];
  for (const group of detailedGroups) {
    const domainName = domains.find((d) => d.id === group.domainId)?.name;
    const sameDomain = faculty.filter((f) =>
      f.domains.some((d) => d.name === domainName),
    );
    const others = faculty.filter(
      (f) => !f.domains.some((d) => d.name === domainName),
    );
    const ordered = [...shuffle(sameDomain), ...shuffle(others)].slice(0, 6);
    if (ordered.length < 6) continue;

    await prisma.guidePreference.createMany({
      data: ordered.map((f, index) => ({
        groupId: group.id,
        facultyId: f.id,
        rank: index + 1,
      })),
    });
  }
  console.log(`  6 ranked preferences for ${detailedGroups.length} groups`);

  // --- allocations for the already-allocated groups ------------------------
  const load = new Map<string, number>();
  const allocationRun = await prisma.allocationRun.create({
    data: {
      cycleId: major.id,
      triggeredById: admin.id,
      startedAt: daysFromNow(-14),
      finishedAt: daysFromNow(-14),
      groupsConsidered: allocatedGroups.length,
      facultyConsidered: faculty.length,
      allocatedCount: allocatedGroups.length,
      unallocatedCount: 0,
      params: {
        tieBreak: ["domainMatch", "avgCgpa", "prefsSubmittedAt", "groupCode"],
        capacityDefault: 2,
      },
    },
  });

  for (const group of allocatedGroups) {
    const prefs = await prisma.guidePreference.findMany({
      where: { groupId: group.id },
      orderBy: { rank: "asc" },
    });
    const chosen = prefs.find(
      (pref) => (load.get(pref.facultyId) ?? 0) < 2,
    );
    if (!chosen) continue;
    load.set(chosen.facultyId, (load.get(chosen.facultyId) ?? 0) + 1);

    await prisma.allocation.create({
      data: {
        cycleId: major.id,
        groupId: group.id,
        facultyId: chosen.facultyId,
        matchedRank: chosen.rank,
        method: "GALE_SHAPLEY",
        status: "ALLOCATED",
        runId: allocationRun.id,
      },
    });
  }
  const allocationCount = await prisma.allocation.count();
  console.log(`  ${allocationCount} allocations from 1 historical run`);

  // --- titles for allocated groups ----------------------------------------
  if (allocatedGroups.length > CURRENT_TITLES.length) {
    // Reusing a title with a suffix would seed genuine near-duplicates and
    // make the originality screen look broken, so refuse instead of fudging.
    throw new Error(
      `Only ${CURRENT_TITLES.length} distinct titles for ${allocatedGroups.length} allocated groups. ` +
        `Add more to prisma/seed-data/titles.ts.`,
    );
  }

  for (const [index, group] of allocatedGroups.entries()) {
    const entry = CURRENT_TITLES[index];
    const title = entry.title;
    await prisma.projectTitle.create({
      data: {
        cycleId: major.id,
        groupId: group.id,
        title,
        normalizedTitle: normalizeTitle(title),
        problemStatement: entry.statement,
        domainId: group.domainId,
        source: "STUDENT_SUBMISSION",
        approvalStatus: index % 4 === 0 ? "PENDING" : "APPROVED",
        reviewedById: index % 4 === 0 ? null : admin.id,
        reviewedAt: index % 4 === 0 ? null : daysFromNow(-10),
      },
    });
  }
  console.log(`  ${allocatedGroups.length} submitted titles`);

  // --- originality scores --------------------------------------------------
  // Run every seeded title through the real engine against the rest of the
  // corpus. Without this the Title Registry ships with an empty Similarity
  // column and a permanently zero "Flagged" count — the screen would look
  // broken even though the engine behind it works.
  const scorable = await prisma.projectTitle.findMany({
    where: {
      OR: [{ cycleId: major.id }, { source: "IMPORTED_CORPUS" }],
      approvalStatus: { not: "REJECTED" },
    },
    select: {
      id: true,
      title: true,
      normalizedTitle: true,
      domainLabel: true,
      guideLabel: true,
      cycleLabel: true,
      domain: { select: { name: true } },
    },
  });

  const corpus: CorpusEntry[] = scorable.map((row) => ({
    id: row.id,
    title: row.title,
    normalizedTitle: row.normalizedTitle,
    domainLabel: row.domain?.name ?? row.domainLabel,
    guideLabel: row.guideLabel,
    cycleLabel: row.cycleLabel,
  }));
  const corpusIndex = buildCorpusIndex(corpus);

  let flagged = 0;
  for (const row of scorable) {
    // excludeId keeps a title from matching itself at 100%.
    const report = checkTitle(row.title, corpusIndex, { excludeId: row.id });
    if (report.score >= 0.8) flagged += 1;
    await prisma.projectTitle.update({
      where: { id: row.id },
      data: {
        similarityScore: report.score,
        similarityReport: JSON.parse(JSON.stringify(report)),
      },
    });
  }
  console.log(
    `  ${scorable.length} titles scored against the corpus (${flagged} at or above 80%)`,
  );

  // --- review sessions, attendance, evaluation -----------------------------
  let sessionCount = 0;
  let attendanceCount = 0;
  let evaluationCount = 0;

  for (const [index, group] of allocatedGroups.entries()) {
    const allocation = await prisma.allocation.findUnique({
      where: { groupId: group.id },
    });
    if (!allocation?.facultyId) continue;

    // Two thirds already happened (so attendance and marks exist), the rest
    // are upcoming (so the dashboards have something to count down to).
    const isPast = index % 3 !== 0;
    const scheduledAt = isPast
      ? daysFromNow(-Math.floor(between(3, 20)))
      : daysFromNow(Math.floor(between(2, 25)));
    scheduledAt.setHours(10 + (index % 6), (index % 2) * 30, 0, 0);

    const session = await prisma.reviewSession.create({
      data: {
        cycleId: major.id,
        groupId: group.id,
        facultyId: allocation.facultyId,
        phase: "R0",
        scheduledAt,
        venue: pick(VENUES),
        status: isPast ? "COMPLETED" : "SCHEDULED",
      },
    });
    sessionCount += 1;

    if (!isPast) continue;

    const members = await prisma.groupMember.findMany({
      where: { groupId: group.id },
    });
    await prisma.attendance.createMany({
      data: members.map((member, memberIndex) => ({
        sessionId: session.id,
        studentId: member.studentId,
        // One absentee in roughly every fourth group.
        status:
          index % 4 === 1 && memberIndex === 2
            ? ("ABSENT" as const)
            : ("PRESENT" as const),
        markedById: admin.id,
      })),
    });
    attendanceCount += members.length;

    await prisma.evaluation.create({
      data: {
        sessionId: session.id,
        groupId: group.id,
        facultyId: allocation.facultyId,
        score: Math.round(between(5.5, 9.5) * 2) / 2,
        remarks: pick([
          "Good scope, refine the dataset plan.",
          "Clear problem statement; tighten the evaluation metrics.",
          "Promising approach — show a working prototype at P1.",
          "Literature survey needs two more recent references.",
          "Well presented. Consider scalability of the proposed design.",
        ]),
      },
    });
    evaluationCount += 1;
  }
  console.log(
    `  ${sessionCount} review sessions, ${attendanceCount} attendance rows, ${evaluationCount} evaluations`,
  );

  // --- pending invites for forming groups ----------------------------------
  const formingGroups = await prisma.group.findMany({
    where: { cycleId: major.id, status: "FORMING" },
    include: { members: true },
  });
  const unattached = pool.slice(cursor);
  let inviteCount = 0;
  for (const [index, group] of formingGroups.entries()) {
    const target = unattached[index];
    if (!target) break;
    await prisma.groupInvite.create({
      data: {
        groupId: group.id,
        cycleId: major.id,
        fromStudentId: group.leaderId,
        toStudentId: target.id,
        status: "PENDING",
        message: "We need one more member — join us?",
        expiresAt: daysFromNow(3),
      },
    });
    inviteCount += 1;
  }
  console.log(`  ${inviteCount} pending group invites`);

  // --- calendar import, events and reminders -------------------------------
  const rawText = [
    "BMS INSTITUTE OF TECHNOLOGY AND MANAGEMENT",
    "Department of Computer Science and Engineering",
    "Academic Calendar 2025-26 (Even Semester)",
    "",
    "Major project review 0 (R0) - problem statement presentation - 12 September 2026",
    "Major project phase-1 (P1) review - 04-05 October 2026",
    "Internal assessment week - 20 October 2026",
    "Major project phase-2 (P2) review - 18 November 2026",
    "Project exhibition and viva - 05 December 2026",
  ].join("\n");

  const calendarImport = await prisma.calendarImport.create({
    data: {
      cycleId: major.id,
      filename: "academic-calendar-2025-26.pdf",
      extractedChars: rawText.length,
      detectedEvents: 4,
      rawText,
      uploadedById: admin.id,
    },
  });

  const events = [
    { title: "R0 review", phase: "R0" as const, date: daysFromNow(9), line: "Major project review 0 (R0) - problem statement presentation - 12 September 2026" },
    { title: "P1 review", phase: "P1" as const, date: daysFromNow(31), line: "Major project phase-1 (P1) review - 04-05 October 2026" },
    { title: "P2 review", phase: "P2" as const, date: daysFromNow(76), line: "Major project phase-2 (P2) review - 18 November 2026" },
    { title: "Major project review", phase: "REVIEW" as const, date: daysFromNow(103), line: "Project exhibition and viva - 05 December 2026" },
  ];

  let reminderCount = 0;
  for (const event of events) {
    const created = await prisma.calendarEvent.create({
      data: {
        cycleId: major.id,
        importId: calendarImport.id,
        title: event.title,
        phase: event.phase,
        eventDate: event.date,
        confidence: "HIGH",
        sourceLine: event.line,
      },
    });

    // Spec §3.6 asks for both windows; the prototype only ever made the 7-day.
    for (const [kind, offset] of [
      ["REVIEW_15_DAY", 15],
      ["REVIEW_7_DAY", 7],
    ] as const) {
      const dueAt = reminderDueAt(event.date, offset);
      await prisma.reminder.create({
        data: {
          cycleId: major.id,
          eventId: created.id,
          kind,
          title: `Reminder: ${event.title} on ${event.date.toISOString().slice(0, 10)}`,
          body:
            `This is a reminder that your major project review is scheduled.\n\n` +
            `Event: ${event.title}\n` +
            `Phase: ${event.phase}\n` +
            `Date: ${event.date.toISOString().slice(0, 10)}\n\n` +
            `Source snippet:\n${event.line}\n`,
          eventDate: event.date,
          dueAt,
          // Status is recomputed on read, but seeding it correctly means the
          // dashboards look right before the first cron tick.
          status: dueAt.getTime() <= now.getTime() ? "DUE" : "QUEUED",
        },
      });
      reminderCount += 1;
    }
  }
  console.log(`  1 calendar import, ${events.length} events, ${reminderCount} reminders`);

  // --- orientation ---------------------------------------------------------
  await prisma.orientation.create({
    data: {
      cycleId: major.id,
      type: "TEXT",
      title: "Major Project Orientation",
      summary: "Welcome + expectations for Review 0 and allocation rules.",
      postedByLabel: "Coordinator",
      postedById: admin.id,
      text:
        "Hello everyone. This is your Major Project orientation. Please form groups of exactly four, " +
        "choose a clear domain, and submit six unique guide preferences. Review 0 will evaluate your " +
        "problem statement, approach, and feasibility. Maintain originality — similar titles and copied " +
        "statements will be flagged. Thank you.",
    },
  });
  console.log("  1 orientation");

  console.log(
    `\nDone. Sign in with any seeded address and the password "${password}".\n` +
      `  admin    admin@example.edu\n` +
      `  faculty  ${faculty[0].email}\n` +
      `  student  ${studentRecords[0].email}  (${studentRecords[0].usn})`,
  );
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
