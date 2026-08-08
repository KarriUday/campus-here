import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { formatCgpa } from "@/lib/utils";

/**
 * One report service for both roles.
 *
 * §10 asks for the same export power for faculty as for admin, scoped to their
 * own groups, rather than duplicating export logic per screen. Every builder
 * therefore takes the same `scope`: `admin` sees the whole cycle, `faculty`
 * gets a `guideId` filter applied to the identical query. The filter is derived
 * from the session — never from a request parameter — so a guide cannot widen
 * their own scope.
 */

export class ReportError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "ReportError";
  }
}

export const REPORT_TYPES = [
  "students",
  "groups",
  "allocation",
  "attendance",
  "attendance-cumulative",
  "evaluation",
  "titles",
  "reminders",
  "faculty-load",
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];
export type ReportScope = "admin" | "faculty";

export type ReportRequest = {
  type: ReportType;
  cycleId: string;
  cycleName: string;
  scope: ReportScope;
  /** Required when scope is "faculty"; ignored otherwise. */
  facultyId?: string | null;
  /** Narrows the per-session attendance report to one session. */
  sessionId?: string | null;
};

type Column = { header: string; key: string; width: number };
type Row = Record<string, string | number | null>;

export type ReportSheet = {
  title: string;
  filename: string;
  columns: Column[];
  rows: Row[];
};

/** Reports faculty may run against their own groups. */
const FACULTY_ALLOWED: ReportType[] = [
  "groups",
  "attendance",
  "attendance-cumulative",
  "evaluation",
  "titles",
];

export function assertScopeAllowed(type: ReportType, scope: ReportScope) {
  if (scope === "faculty" && !FACULTY_ALLOWED.includes(type)) {
    throw new ReportError(
      `The ${type} report is cycle-wide and only available to an administrator.`,
      403,
    );
  }
}

/**
 * The single place scope becomes a query filter. `admin` adds nothing;
 * `faculty` restricts to groups that guide actually holds.
 */
function groupWhere(request: ReportRequest) {
  if (request.scope === "faculty") {
    if (!request.facultyId) {
      throw new ReportError("No faculty record for this account.", 403);
    }
    return {
      cycleId: request.cycleId,
      allocation: { facultyId: request.facultyId, status: "ALLOCATED" as const },
    };
  }
  return { cycleId: request.cycleId };
}

const slug = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

async function buildStudents(request: ReportRequest): Promise<ReportSheet> {
  const students = await prisma.student.findMany({
    where: { enrollments: { some: { cycleId: request.cycleId } } },
    orderBy: { usn: "asc" },
    select: {
      usn: true,
      fullName: true,
      email: true,
      phone: true,
      cgpa: true,
      memberships: {
        where: { cycleId: request.cycleId },
        select: {
          role: true,
          group: {
            select: {
              code: true,
              status: true,
              domain: { select: { name: true } },
              title: { select: { title: true } },
              allocation: { select: { faculty: { select: { fullName: true } } } },
            },
          },
        },
      },
    },
  });

  return {
    title: "Students",
    filename: `students-${slug(request.cycleName)}`,
    columns: [
      { header: "USN", key: "usn", width: 16 },
      { header: "Name", key: "name", width: 26 },
      { header: "Email", key: "email", width: 32 },
      { header: "Phone", key: "phone", width: 16 },
      { header: "CGPA", key: "cgpa", width: 8 },
      { header: "Group", key: "group", width: 14 },
      { header: "Role", key: "role", width: 10 },
      { header: "Domain", key: "domain", width: 18 },
      { header: "Title", key: "title", width: 46 },
      { header: "Guide", key: "guide", width: 24 },
    ],
    rows: students.map((student) => {
      const membership = student.memberships[0];
      return {
        usn: student.usn,
        name: student.fullName,
        email: student.email,
        phone: student.phone ?? "",
        cgpa: Number(student.cgpa),
        group: membership?.group.code ?? "",
        role: membership?.role ?? "",
        domain: membership?.group.domain?.name ?? "",
        title: membership?.group.title?.title ?? "",
        guide: membership?.group.allocation?.faculty?.fullName ?? "",
      };
    }),
  };
}

async function buildGroups(request: ReportRequest): Promise<ReportSheet> {
  const groups = await prisma.group.findMany({
    where: groupWhere(request),
    orderBy: { code: "asc" },
    include: {
      domain: { select: { name: true } },
      title: { select: { title: true, approvalStatus: true } },
      allocation: {
        select: { matchedRank: true, faculty: { select: { fullName: true } } },
      },
      members: {
        orderBy: { student: { usn: "asc" } },
        select: { student: { select: { usn: true, fullName: true } } },
      },
      _count: { select: { preferences: true } },
    },
  });

  return {
    title: "Groups",
    filename: `groups-${slug(request.cycleName)}`,
    columns: [
      { header: "Group", key: "code", width: 14 },
      { header: "Status", key: "status", width: 12 },
      { header: "Members", key: "members", width: 9 },
      { header: "Avg CGPA", key: "avgCgpa", width: 10 },
      { header: "Domain", key: "domain", width: 18 },
      { header: "Title", key: "title", width: 46 },
      { header: "Approval", key: "approval", width: 12 },
      { header: "Guide", key: "guide", width: 24 },
      { header: "Choice", key: "rank", width: 8 },
      { header: "Preferences", key: "prefs", width: 12 },
      { header: "Roster", key: "roster", width: 60 },
    ],
    rows: groups.map((group) => ({
      code: group.code,
      status: group.status,
      members: group.members.length,
      avgCgpa: Number(group.avgCgpa),
      domain: group.domain?.name ?? "",
      title: group.title?.title ?? "",
      approval: group.title?.approvalStatus ?? "",
      guide: group.allocation?.faculty?.fullName ?? "",
      rank: group.allocation?.matchedRank ?? "",
      prefs: group._count.preferences,
      roster: group.members
        .map((m) => `${m.student.usn} ${m.student.fullName}`)
        .join("; "),
    })),
  };
}

async function buildAllocation(request: ReportRequest): Promise<ReportSheet> {
  const allocations = await prisma.allocation.findMany({
    where: { cycleId: request.cycleId },
    orderBy: [{ status: "asc" }, { group: { code: "asc" } }],
    include: {
      group: {
        select: {
          code: true,
          avgCgpa: true,
          domain: { select: { name: true } },
        },
      },
      faculty: { select: { fullName: true, designation: true } },
    },
  });

  return {
    title: "Allocation",
    filename: `allocation-${slug(request.cycleName)}`,
    columns: [
      { header: "Group", key: "code", width: 14 },
      { header: "Avg CGPA", key: "avgCgpa", width: 10 },
      { header: "Domain", key: "domain", width: 18 },
      { header: "Guide", key: "guide", width: 26 },
      { header: "Designation", key: "designation", width: 22 },
      { header: "Choice satisfied", key: "rank", width: 16 },
      { header: "Method", key: "method", width: 16 },
      { header: "Status", key: "status", width: 14 },
      { header: "Reason if unallocated", key: "reason", width: 26 },
    ],
    rows: allocations.map((row) => ({
      code: row.group.code,
      avgCgpa: Number(row.group.avgCgpa),
      domain: row.group.domain?.name ?? "",
      guide: row.faculty?.fullName ?? "",
      designation: row.faculty?.designation ?? "",
      rank: row.matchedRank ?? "",
      method: row.method,
      status: row.status,
      reason: row.unallocatedReason ?? "",
    })),
  };
}

async function buildAttendance(request: ReportRequest): Promise<ReportSheet> {
  const sessions = await prisma.reviewSession.findMany({
    where: {
      cycleId: request.cycleId,
      ...(request.sessionId ? { id: request.sessionId } : {}),
      ...(request.scope === "faculty" && request.facultyId
        ? { facultyId: request.facultyId }
        : {}),
    },
    orderBy: { scheduledAt: "asc" },
    include: {
      group: { select: { code: true } },
      faculty: { select: { fullName: true } },
      attendance: {
        include: { student: { select: { usn: true, fullName: true } } },
      },
    },
  });

  const rows: Row[] = [];
  for (const session of sessions) {
    for (const record of session.attendance) {
      rows.push({
        date: session.scheduledAt.toISOString().slice(0, 10),
        time: session.scheduledAt.toISOString().slice(11, 16),
        phase: session.phase,
        group: session.group.code,
        venue: session.venue,
        guide: session.faculty?.fullName ?? "",
        usn: record.student.usn,
        name: record.student.fullName,
        status: record.status,
        remarks: record.remarks ?? "",
      });
    }
  }

  return {
    title: "Attendance",
    filename: `attendance-${slug(request.cycleName)}`,
    columns: [
      { header: "Date", key: "date", width: 12 },
      { header: "Time", key: "time", width: 8 },
      { header: "Phase", key: "phase", width: 8 },
      { header: "Group", key: "group", width: 14 },
      { header: "Venue", key: "venue", width: 20 },
      { header: "Guide", key: "guide", width: 24 },
      { header: "USN", key: "usn", width: 16 },
      { header: "Name", key: "name", width: 26 },
      { header: "Status", key: "status", width: 10 },
      { header: "Remarks", key: "remarks", width: 30 },
    ],
    rows,
  };
}

/** One row per student, with a column per review session. */
async function buildAttendanceCumulative(
  request: ReportRequest,
): Promise<ReportSheet> {
  const sessions = await prisma.reviewSession.findMany({
    where: {
      cycleId: request.cycleId,
      ...(request.scope === "faculty" && request.facultyId
        ? { facultyId: request.facultyId }
        : {}),
    },
    orderBy: { scheduledAt: "asc" },
    include: {
      group: { select: { code: true } },
      attendance: { select: { studentId: true, status: true } },
    },
  });

  const students = await prisma.student.findMany({
    where: {
      memberships: { some: groupWhere(request) },
    },
    orderBy: { usn: "asc" },
    select: {
      id: true,
      usn: true,
      fullName: true,
      memberships: {
        where: { cycleId: request.cycleId },
        select: { group: { select: { code: true } } },
      },
    },
  });

  const columns: Column[] = [
    { header: "USN", key: "usn", width: 16 },
    { header: "Name", key: "name", width: 26 },
    { header: "Group", key: "group", width: 14 },
  ];
  for (const session of sessions) {
    columns.push({
      header: `${session.group.code} ${session.phase}`,
      key: `s_${session.id}`,
      width: 16,
    });
  }
  columns.push(
    { header: "Present", key: "present", width: 10 },
    { header: "Absent", key: "absent", width: 10 },
    { header: "Attendance %", key: "percent", width: 14 },
  );

  const rows: Row[] = students.map((student) => {
    const row: Row = {
      usn: student.usn,
      name: student.fullName,
      group: student.memberships[0]?.group.code ?? "",
    };
    let present = 0;
    let absent = 0;
    for (const session of sessions) {
      const record = session.attendance.find((a) => a.studentId === student.id);
      row[`s_${session.id}`] = record?.status ?? "";
      if (record?.status === "PRESENT") present += 1;
      if (record?.status === "ABSENT") absent += 1;
    }
    row.present = present;
    row.absent = absent;
    row.percent =
      present + absent === 0
        ? ""
        : Math.round((present / (present + absent)) * 100);
    return row;
  });

  return {
    title: "Attendance (cumulative)",
    filename: `attendance-cumulative-${slug(request.cycleName)}`,
    columns,
    rows,
  };
}

async function buildEvaluation(request: ReportRequest): Promise<ReportSheet> {
  const evaluations = await prisma.evaluation.findMany({
    where: {
      session: { cycleId: request.cycleId },
      // Only narrow when the id is genuinely present; a null would widen the
      // filter back out rather than restricting it.
      ...(request.scope === "faculty" && request.facultyId
        ? { facultyId: request.facultyId }
        : {}),
    },
    orderBy: [{ group: { code: "asc" } }],
    include: {
      group: { select: { code: true, avgCgpa: true } },
      session: { select: { phase: true, scheduledAt: true, venue: true } },
      faculty: { select: { fullName: true } },
    },
  });

  return {
    title: "Evaluation",
    filename: `evaluation-${slug(request.cycleName)}`,
    columns: [
      { header: "Group", key: "group", width: 14 },
      { header: "Phase", key: "phase", width: 8 },
      { header: "Reviewed on", key: "date", width: 14 },
      { header: "Venue", key: "venue", width: 20 },
      { header: "Guide", key: "guide", width: 26 },
      { header: "Score (of 10)", key: "score", width: 14 },
      { header: "Group avg CGPA", key: "avgCgpa", width: 16 },
      { header: "Remarks", key: "remarks", width: 50 },
    ],
    rows: evaluations.map((row) => ({
      group: row.group.code,
      phase: row.session.phase,
      date: row.session.scheduledAt.toISOString().slice(0, 10),
      venue: row.session.venue,
      guide: row.faculty.fullName,
      score: Number(row.score),
      avgCgpa: Number(row.group.avgCgpa),
      remarks: row.remarks ?? "",
    })),
  };
}

async function buildTitles(request: ReportRequest): Promise<ReportSheet> {
  const titles = await prisma.projectTitle.findMany({
    where: {
      cycleId: request.cycleId,
      ...(request.scope === "faculty"
        ? {
            source: "STUDENT_SUBMISSION",
            group: {
              allocation: { facultyId: request.facultyId, status: "ALLOCATED" },
            },
          }
        : {}),
    },
    orderBy: [{ source: "asc" }, { title: "asc" }],
    include: {
      domain: { select: { name: true } },
      group: {
        select: {
          code: true,
          allocation: { select: { faculty: { select: { fullName: true } } } },
        },
      },
    },
  });

  return {
    title: "Titles",
    filename: `titles-${slug(request.cycleName)}`,
    columns: [
      { header: "Title", key: "title", width: 52 },
      { header: "Group", key: "group", width: 14 },
      { header: "Domain", key: "domain", width: 18 },
      { header: "Guide", key: "guide", width: 26 },
      { header: "Source", key: "source", width: 18 },
      { header: "Approval", key: "approval", width: 12 },
      { header: "Similarity %", key: "similarity", width: 14 },
      { header: "Problem statement", key: "statement", width: 60 },
    ],
    rows: titles.map((row) => ({
      title: row.title,
      group: row.group?.code ?? row.groupLabel ?? "",
      domain: row.domain?.name ?? row.domainLabel ?? "",
      guide: row.group?.allocation?.faculty?.fullName ?? row.guideLabel ?? "",
      source: row.source === "IMPORTED_CORPUS" ? "Previous batch" : "Submitted",
      approval: row.approvalStatus,
      similarity:
        row.similarityScore === null
          ? ""
          : Math.round(Number(row.similarityScore) * 100),
      statement: row.problemStatement ?? "",
    })),
  };
}

async function buildReminders(request: ReportRequest): Promise<ReportSheet> {
  const reminders = await prisma.reminder.findMany({
    where: { cycleId: request.cycleId },
    orderBy: { dueAt: "asc" },
    include: { event: { select: { phase: true, sourceLine: true } } },
  });

  return {
    title: "Reminders",
    filename: `reminders-${slug(request.cycleName)}`,
    columns: [
      { header: "Reminder time", key: "dueAt", width: 20 },
      { header: "Window", key: "kind", width: 16 },
      { header: "Event date", key: "eventDate", width: 14 },
      { header: "Phase", key: "phase", width: 10 },
      { header: "Title", key: "title", width: 46 },
      { header: "Status", key: "status", width: 10 },
      { header: "Attempts", key: "attempts", width: 10 },
      { header: "Sent at", key: "sentAt", width: 20 },
      { header: "Last error", key: "error", width: 30 },
    ],
    rows: reminders.map((row) => ({
      dueAt: row.dueAt.toISOString().slice(0, 16).replace("T", " "),
      kind: row.kind === "REVIEW_15_DAY" ? "15 days before" : "7 days before",
      eventDate: row.eventDate.toISOString().slice(0, 10),
      phase: row.event?.phase ?? "",
      title: row.title,
      status: row.status,
      attempts: row.attempts,
      sentAt: row.sentAt
        ? row.sentAt.toISOString().slice(0, 16).replace("T", " ")
        : "",
      error: row.lastError ?? "",
    })),
  };
}

async function buildFacultyLoad(request: ReportRequest): Promise<ReportSheet> {
  const faculty = await prisma.faculty.findMany({
    orderBy: { fullName: "asc" },
    include: {
      domains: { select: { name: true } },
      allocations: {
        where: { cycleId: request.cycleId, status: "ALLOCATED" },
        include: { group: { select: { code: true } } },
      },
    },
  });

  return {
    title: "Faculty load",
    filename: `faculty-load-${slug(request.cycleName)}`,
    columns: [
      { header: "Name", key: "name", width: 26 },
      { header: "Email", key: "email", width: 32 },
      { header: "Designation", key: "designation", width: 22 },
      { header: "Domains", key: "domains", width: 28 },
      { header: "Capacity", key: "capacity", width: 10 },
      { header: "Assigned", key: "assigned", width: 10 },
      { header: "Free", key: "free", width: 8 },
      { header: "Groups", key: "groups", width: 34 },
      { header: "Active", key: "active", width: 8 },
    ],
    rows: faculty.map((member) => ({
      name: member.fullName,
      email: member.email,
      designation: member.designation,
      domains: member.domains.map((d) => d.name).join("; "),
      capacity: member.capacity,
      assigned: member.allocations.length,
      free: Math.max(0, member.capacity - member.allocations.length),
      groups: member.allocations.map((a) => a.group.code).join("; "),
      active: member.isActive ? "yes" : "no",
    })),
  };
}

const BUILDERS: Record<ReportType, (r: ReportRequest) => Promise<ReportSheet>> = {
  students: buildStudents,
  groups: buildGroups,
  allocation: buildAllocation,
  attendance: buildAttendance,
  "attendance-cumulative": buildAttendanceCumulative,
  evaluation: buildEvaluation,
  titles: buildTitles,
  reminders: buildReminders,
  "faculty-load": buildFacultyLoad,
};

export async function buildReport(request: ReportRequest): Promise<ReportSheet> {
  assertScopeAllowed(request.type, request.scope);
  const builder = BUILDERS[request.type];
  if (!builder) throw new ReportError(`Unknown report type "${request.type}".`);
  return builder(request);
}

// ---------------------------------------------------------------------------
// Workbook
// ---------------------------------------------------------------------------

/**
 * Real .xlsx with a formatted header row, a frozen pane, an autofilter and
 * sized columns.
 *
 * exceljs rather than SheetJS: the community build of SheetJS silently drops
 * cell styles on write (styling is a paid feature), so it cannot produce the
 * formatted header §10 asks for. Verified — a bold header set through SheetJS
 * CE does not survive a write/read round-trip.
 */
export async function toWorkbook(
  sheet: ReportSheet,
  meta: { cycleName: string; scope: ReportScope; generatedBy: string },
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Campus Here";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(sheet.title.slice(0, 31), {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  worksheet.columns = sheet.columns.map((column) => ({
    header: column.header,
    key: column.key,
    width: column.width,
  }));

  for (const row of sheet.rows) worksheet.addRow(row);

  const header = worksheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    // The product's primary fuchsia, so an exported sheet is recognisably ours.
    fgColor: { argb: "FFC026D3" },
  };
  header.alignment = { vertical: "middle" };
  header.height = 22;

  if (sheet.rows.length > 0) {
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: sheet.columns.length },
    };
  }

  // A short provenance sheet, so a file handed to a coordinator explains itself.
  const about = workbook.addWorksheet("About");
  about.columns = [
    { header: "Field", key: "field", width: 22 },
    { header: "Value", key: "value", width: 52 },
  ];
  about.addRows([
    { field: "Report", value: sheet.title },
    { field: "Cycle", value: meta.cycleName },
    { field: "Scope", value: meta.scope === "faculty" ? "This guide's groups only" : "Whole cycle" },
    { field: "Rows", value: sheet.rows.length },
    { field: "Generated", value: new Date().toLocaleString("en-IN") },
    { field: "Generated by", value: meta.generatedBy },
  ]);
  about.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/** Convenience for the UI: a human label per report type. */
export const REPORT_LABEL: Record<ReportType, string> = {
  students: "Student list",
  groups: "Group list",
  allocation: "Allocation report",
  attendance: "Attendance (per session)",
  "attendance-cumulative": "Attendance (cumulative)",
  evaluation: "Evaluation report",
  titles: "Title registry",
  reminders: "Reminder schedule",
  "faculty-load": "Faculty load",
};

export { formatCgpa };
