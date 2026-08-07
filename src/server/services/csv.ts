import Papa from "papaparse";
import type { Designation } from "@/generated/prisma/enums";
import { normalizeEmail, normalizeUsn } from "@/lib/utils";

/**
 * CSV ingestion.
 *
 * The student validator reproduces the prototype's rules and its exact error
 * strings, so an admin who already knows the tool sees the same messages. The
 * faculty validator is new — the prototype's "Upload faculty list" button had
 * no parser behind it at all.
 *
 * As in the prototype, the first failing rule wins for a row: one error per
 * row keeps the error table readable when a spreadsheet is badly formatted.
 */

export type RowIssue = {
  rowNumber: number;
  usn?: string;
  email?: string;
  message: string;
};

export type ValidationResult<T> = {
  totalRows: number;
  valid: T[];
  issues: RowIssue[];
};

export type StudentRow = {
  usn: string;
  fullName: string;
  email: string;
  cgpa: number;
  phone: string | null;
  /** True when this USN already exists and only needs enrolling in the cycle. */
  existing: boolean;
};

export type FacultyRow = {
  fullName: string;
  email: string;
  designation: Designation;
  domains: string[];
  capacity: number;
  phone: string | null;
  employeeId: string | null;
  existing: boolean;
};

export type TitleRow = {
  title: string;
  domainLabel: string | null;
  guideLabel: string | null;
  groupLabel: string | null;
  cycleLabel: string | null;
};

type ParsedCsv = { headers: string[]; rows: string[][] };

/** Parse CSV text into a header row plus data rows, all trimmed. */
export function parseCsv(text: string): ParsedCsv {
  const result = Papa.parse<string[]>(text.trim(), {
    skipEmptyLines: "greedy",
  });
  const rows = (result.data ?? []).map((row) =>
    row.map((cell) => (cell ?? "").trim()),
  );
  if (rows.length === 0) return { headers: [], rows: [] };
  const [headerRow, ...dataRows] = rows;
  return {
    headers: headerRow.map((h) => h.toLowerCase().trim()),
    rows: dataRows,
  };
}

/** Index of the first header matching any of the given aliases, or -1. */
function columnIndex(headers: string[], aliases: string[]): number {
  for (const alias of aliases) {
    const index = headers.indexOf(alias);
    if (index !== -1) return index;
  }
  return -1;
}

const cell = (row: string[], index: number) =>
  index === -1 ? "" : (row[index] ?? "").trim();

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

export type ExistingStudentIndex = {
  /** USNs already enrolled in the target cycle. */
  enrolledUsns: Set<string>;
  /** Every USN in the database, enrolled in this cycle or not. */
  knownUsns: Set<string>;
  /** email -> USN, so a reused address on a different person is caught. */
  emailOwners: Map<string, string>;
};

export function validateStudentRows(
  text: string,
  existing: ExistingStudentIndex,
): ValidationResult<StudentRow> {
  const { headers, rows } = parseCsv(text);
  if (headers.length === 0 || rows.length === 0) {
    return {
      totalRows: 0,
      valid: [],
      issues: [{ rowNumber: 1, message: "CSV is empty." }],
    };
  }

  const usnAt = columnIndex(headers, ["usn"]);
  const nameAt = columnIndex(headers, ["name", "full_name", "full name"]);
  const cgpaAt = columnIndex(headers, ["cgpa"]);
  const emailAt = columnIndex(headers, ["email"]);
  const phoneAt = columnIndex(headers, ["phone", "mobile", "contact"]);

  const missing: string[] = [];
  if (usnAt === -1) missing.push("usn");
  if (nameAt === -1) missing.push("name (or full_name)");
  if (cgpaAt === -1) missing.push("cgpa");
  if (emailAt === -1) missing.push("email");
  if (missing.length > 0) {
    return {
      totalRows: rows.length,
      valid: [],
      issues: [
        {
          rowNumber: 1,
          message: `Missing required columns: ${missing.join(", ")}`,
        },
      ],
    };
  }

  const valid: StudentRow[] = [];
  const issues: RowIssue[] = [];
  const seenUsn = new Set<string>();
  const seenEmail = new Set<string>();

  rows.forEach((row, index) => {
    // +2: one for the header row, one because spreadsheets are 1-indexed.
    const rowNumber = index + 2;
    const usn = normalizeUsn(cell(row, usnAt));
    const fullName = cell(row, nameAt);
    const cgpaRaw = cell(row, cgpaAt);
    const email = normalizeEmail(cell(row, emailAt));
    const phone = cell(row, phoneAt);
    const fail = (message: string) =>
      issues.push({ rowNumber, usn: usn || undefined, email: email || undefined, message });

    if (!usn) return fail("USN is required.");
    if (!fullName) return fail("Name is required.");

    const cgpa = Number(cgpaRaw);
    if (!cgpaRaw || !Number.isFinite(cgpa) || cgpa < 0 || cgpa > 10) {
      return fail("CGPA must be a number between 0 and 10.");
    }

    if (!email || !email.includes("@")) return fail("Valid email is required.");

    if (seenUsn.has(usn) || existing.enrolledUsns.has(usn)) {
      return fail("Duplicate USN.");
    }
    // A known address belonging to someone else is a conflict; the same
    // address on the same USN is just this person being re-uploaded.
    const emailOwner = existing.emailOwners.get(email);
    if (seenEmail.has(email) || (emailOwner && emailOwner !== usn)) {
      return fail("Duplicate email.");
    }

    seenUsn.add(usn);
    seenEmail.add(email);
    valid.push({
      usn,
      fullName,
      email,
      cgpa: Math.round(cgpa * 100) / 100,
      phone: phone || null,
      existing: existing.knownUsns.has(usn),
    });
  });

  return { totalRows: rows.length, valid, issues };
}

// ---------------------------------------------------------------------------
// Faculty
// ---------------------------------------------------------------------------

const DESIGNATIONS: Record<string, Designation> = {
  "assistant professor": "ASSISTANT_PROFESSOR",
  "asst professor": "ASSISTANT_PROFESSOR",
  "asst. professor": "ASSISTANT_PROFESSOR",
  assistant: "ASSISTANT_PROFESSOR",
  ASSISTANT_PROFESSOR: "ASSISTANT_PROFESSOR",
  "associate professor": "ASSOCIATE_PROFESSOR",
  "assoc professor": "ASSOCIATE_PROFESSOR",
  "assoc. professor": "ASSOCIATE_PROFESSOR",
  associate: "ASSOCIATE_PROFESSOR",
  ASSOCIATE_PROFESSOR: "ASSOCIATE_PROFESSOR",
  professor: "PROFESSOR",
  prof: "PROFESSOR",
  PROFESSOR: "PROFESSOR",
};

export function parseDesignation(value: string): Designation | null {
  const key = value.trim();
  return DESIGNATIONS[key] ?? DESIGNATIONS[key.toLowerCase()] ?? null;
}

export function validateFacultyRows(
  text: string,
  existingEmails: Set<string>,
): ValidationResult<FacultyRow> {
  const { headers, rows } = parseCsv(text);
  if (headers.length === 0 || rows.length === 0) {
    return {
      totalRows: 0,
      valid: [],
      issues: [{ rowNumber: 1, message: "CSV is empty." }],
    };
  }

  const nameAt = columnIndex(headers, ["name", "full_name", "full name", "faculty"]);
  const emailAt = columnIndex(headers, ["email"]);
  const designationAt = columnIndex(headers, ["designation", "cadre", "rank"]);
  const domainsAt = columnIndex(headers, ["domains", "domain", "specialization", "specialisation"]);
  const capacityAt = columnIndex(headers, ["capacity", "max_groups", "max groups"]);
  const phoneAt = columnIndex(headers, ["phone", "mobile", "contact"]);
  const employeeAt = columnIndex(headers, ["employee_id", "employee id", "empid", "emp_id"]);

  const missing: string[] = [];
  if (nameAt === -1) missing.push("name (or full_name)");
  if (emailAt === -1) missing.push("email");
  if (designationAt === -1) missing.push("designation");
  if (missing.length > 0) {
    return {
      totalRows: rows.length,
      valid: [],
      issues: [
        {
          rowNumber: 1,
          message: `Missing required columns: ${missing.join(", ")}`,
        },
      ],
    };
  }

  const valid: FacultyRow[] = [];
  const issues: RowIssue[] = [];
  const seenEmail = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const fullName = cell(row, nameAt);
    const email = normalizeEmail(cell(row, emailAt));
    const designationRaw = cell(row, designationAt);
    const domainsRaw = cell(row, domainsAt);
    const capacityRaw = cell(row, capacityAt);
    const fail = (message: string) =>
      issues.push({ rowNumber, email: email || undefined, message });

    if (!fullName) return fail("Name is required.");
    if (!email || !email.includes("@")) return fail("Valid email is required.");

    const designation = parseDesignation(designationRaw);
    if (!designation) {
      return fail(
        "Designation must be Assistant Professor, Associate Professor, or Professor.",
      );
    }

    let capacity = 2;
    if (capacityRaw) {
      const parsed = Number(capacityRaw);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10) {
        return fail("Capacity must be a whole number between 1 and 10.");
      }
      capacity = parsed;
    }

    if (seenEmail.has(email)) return fail("Duplicate email.");
    seenEmail.add(email);

    valid.push({
      fullName,
      email,
      designation,
      // Semicolon-separated so a comma-delimited CSV does not need quoting.
      domains: domainsRaw
        .split(/[;|]/)
        .map((d) => d.trim())
        .filter(Boolean),
      capacity,
      phone: cell(row, phoneAt) || null,
      employeeId: cell(row, employeeAt) || null,
      existing: existingEmails.has(email),
    });
  });

  return { totalRows: rows.length, valid, issues };
}

// ---------------------------------------------------------------------------
// Previous-title corpus
// ---------------------------------------------------------------------------

/**
 * Accepts either one title per line, or a CSV whose headers are
 * `title, group, domain, guide, cycle` — plus the aliases spec §3.4 lists:
 * `project title`, `final title`, `group code`, `faculty`, `mentor`.
 */
export function parseTitleImport(text: string): ValidationResult<TitleRow> {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      totalRows: 0,
      valid: [],
      issues: [{ rowNumber: 1, message: "Nothing to import." }],
    };
  }

  const { headers, rows } = parseCsv(trimmed);
  const titleAt = columnIndex(headers, [
    "title",
    "project title",
    "final title",
    "project_title",
    "final_title",
  ]);

  // No recognisable title header: treat the whole payload as one per line.
  if (titleAt === -1) {
    const lines = trimmed
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const valid: TitleRow[] = [];
    const issues: RowIssue[] = [];
    const seen = new Set<string>();

    lines.forEach((line, index) => {
      const rowNumber = index + 1;
      if (line.length < 3) {
        issues.push({ rowNumber, message: "Title is too short." });
        return;
      }
      const key = line.toLowerCase();
      if (seen.has(key)) {
        issues.push({ rowNumber, message: "Duplicate title in this file." });
        return;
      }
      seen.add(key);
      valid.push({
        title: line,
        domainLabel: null,
        guideLabel: null,
        groupLabel: null,
        cycleLabel: null,
      });
    });

    return { totalRows: lines.length, valid, issues };
  }

  const groupAt = columnIndex(headers, ["group", "group code", "group_code"]);
  const domainAt = columnIndex(headers, ["domain", "cluster"]);
  const guideAt = columnIndex(headers, ["guide", "faculty", "mentor"]);
  const cycleAt = columnIndex(headers, ["cycle", "batch", "year"]);

  const valid: TitleRow[] = [];
  const issues: RowIssue[] = [];
  const seen = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const title = cell(row, titleAt);
    if (!title) {
      issues.push({ rowNumber, message: "Title is required." });
      return;
    }
    if (title.length < 3) {
      issues.push({ rowNumber, message: "Title is too short." });
      return;
    }
    const key = title.toLowerCase();
    if (seen.has(key)) {
      issues.push({ rowNumber, message: "Duplicate title in this file." });
      return;
    }
    seen.add(key);

    valid.push({
      title,
      domainLabel: cell(row, domainAt) || null,
      guideLabel: cell(row, guideAt) || null,
      groupLabel: cell(row, groupAt) || null,
      cycleLabel: cell(row, cycleAt) || null,
    });
  });

  return { totalRows: rows.length, valid, issues };
}

// ---------------------------------------------------------------------------
// Sample files offered on the ingestion screen
// ---------------------------------------------------------------------------

export const SAMPLE_STUDENT_CSV = `usn,name,cgpa,phone,email
1BY23CS401,Rahul Verma,8.76,9000000101,rahul.verma401@example.edu
1BY23CS402,Meera Shetty,9.04,9000000102,meera.shetty402@example.edu
1BY23CS403,Sahil Kamath,8.90,9000000103,sahil.kamath403@example.edu
`;

export const SAMPLE_FACULTY_CSV = `name,email,designation,domains,capacity,phone
Dr. Example Guide,example.guide@example.edu,Associate Professor,AI/ML;Data Science,2,9800000001
Prof. Second Guide,second.guide@example.edu,Professor,Web;Cloud & DevOps,2,9800000002
`;

export const SAMPLE_TITLE_CSV = `title,group,domain,guide,cycle
Smart Irrigation Scheduling with Soil Sensors,CSE6-A-101,IoT,Dr. Example Guide,2024-25 Major
Automated Question Paper Generator,CSE6-A-102,Web,Prof. Second Guide,2024-25 Major
`;
