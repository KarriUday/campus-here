// Phase L: scoped ReportService and real .xlsx output.
import { createRequire } from "node:module";
const require_ = createRequire(new URL("../../package.json", import.meta.url));
const ExcelJS = require_("exceljs");

const B = "http://localhost:3000";
const sessions = new Map();

async function login(email) {
  const res = await fetch(`${B}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "Campus@123" }),
  });
  if (!res.ok) throw new Error(`login ${email}: ${res.status}`);
  sessions.set(email, res.headers.getSetCookie().find((c) => c.startsWith("ch_session=")).split(";")[0]);
  return email;
}

const api = (who, path, options = {}) =>
  fetch(`${B}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Cookie: sessions.get(who), ...(options.headers ?? {}) },
  });

async function json(who, path) {
  const res = await api(who, path);
  return { status: res.status, body: await res.json().catch(() => null) };
}

/** Download a report and read it back with a real xlsx parser. */
async function download(who, type, extra = "") {
  const res = await api(who, `/api/reports/export?type=${type}${extra}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { status: res.status, error: body.error };
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  const headerRow = sheet.getRow(1);
  const headers = [];
  headerRow.eachCell((cell) => headers.push(String(cell.value)));

  const rows = [];
  sheet.eachRow((row, i) => {
    if (i === 1) return;
    const record = {};
    row.eachCell((cell, c) => { record[headers[c - 1]] = cell.value; });
    rows.push(record);
  });

  return {
    status: 200,
    bytes: buffer.length,
    filename: (res.headers.get("content-disposition") ?? "").match(/filename="?([^"]+)"?/)?.[1],
    contentType: res.headers.get("content-type"),
    sheetNames: workbook.worksheets.map((w) => w.name),
    headers,
    rows,
    headerBold: headerRow.font?.bold === true,
    headerFill: headerRow.fill?.fgColor?.argb,
    frozen: sheet.views?.[0]?.state,
    autoFilter: Boolean(sheet.autoFilter),
    firstColWidth: sheet.columns?.[0]?.width,
  };
}

let pass = 0, fail = 0;
const check = (label, ok, detail = "") => {
  if (ok) { pass++; console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ""}`); }
  else { fail++; console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`); }
};

const admin = await login("admin@example.edu");

console.log("\n=== L1: every admin report downloads as a real workbook ===");
const TYPES = [
  "students", "groups", "allocation", "attendance", "attendance-cumulative",
  "evaluation", "titles", "reminders", "faculty-load",
];
for (const type of TYPES) {
  const report = await download(admin, type);
  const ok = report.status === 200 && report.rows !== undefined;
  check(
    `${type}`,
    ok,
    ok ? `${report.rows.length} rows, ${report.headers.length} cols, ${(report.bytes / 1024).toFixed(0)}KB` : report.error,
  );
}

console.log("\n=== L2: formatting §10 asks for ===");
const students = await download(admin, "students");
check("content type is xlsx",
  students.contentType?.includes("spreadsheetml.sheet"), students.contentType);
check("header row is bold", students.headerBold === true);
check("header row is filled", Boolean(students.headerFill), students.headerFill);
check("header pane is frozen", students.frozen === "frozen", students.frozen);
check("an autofilter is set", students.autoFilter === true);
check("columns are sized", (students.firstColWidth ?? 0) > 0, `first col width ${students.firstColWidth}`);
check("an About sheet records provenance",
  students.sheetNames.includes("About"), students.sheetNames.join(", "));
check("the filename is descriptive", /students-2025-26/.test(students.filename ?? ""), students.filename);

console.log("\n=== L3: the data is real ===");
check("student report covers the whole cohort", students.rows.length === 300, `${students.rows.length} rows`);
const withGroup = students.rows.filter((r) => r.Group).length;
check("group membership is populated", withGroup > 200, `${withGroup} students in a group`);
const alloc = await download(admin, "allocation");
check("allocation report names guides",
  alloc.rows.some((r) => r.Guide && r["Choice satisfied"]),
  `e.g. ${alloc.rows[0]?.Group} -> ${alloc.rows[0]?.Guide} (choice ${alloc.rows[0]?.["Choice satisfied"]})`);

console.log("\n=== L4: faculty scope is enforced, not requested ===");
const allocState = await json(admin, "/api/allocation");
const allocated = allocState.body.allocations.filter((a) => a.status === "ALLOCATED");
const facultyList = await json(admin, "/api/faculty");
const guideNames = [...new Set(allocated.map((a) => a.guide))].slice(0, 2);
const guides = guideNames.map((n) => facultyList.body.faculty.find((f) => f.fullName === n));
const guideA = await login(guides[0].email);
const guideB = await login(guides[1].email);

const groupsA = await download(guideA, "groups");
const groupsB = await download(guideB, "groups");
const codesA = new Set(groupsA.rows.map((r) => r.Group));
const codesB = new Set(groupsB.rows.map((r) => r.Group));
const shared = [...codesA].filter((c) => codesB.has(c));
check("two guides export disjoint group sets", shared.length === 0,
  `${codesA.size} vs ${codesB.size} groups, ${shared.length} shared`);
check("a guide's export is smaller than the admin's",
  groupsA.rows.length < (await download(admin, "groups")).rows.length,
  `${groupsA.rows.length} vs all groups`);
check("every exported group really belongs to that guide",
  groupsA.rows.every((r) => r.Guide === guides[0].fullName),
  `all ${groupsA.rows.length} rows show ${guides[0].fullName}`);

console.log("\n=== L5: a guide cannot request a cycle-wide report ===");
for (const type of ["students", "allocation", "reminders", "faculty-load"]) {
  const denied = await download(guideA, type);
  check(`${type} is refused for faculty`, denied.status === 403, denied.error);
}
// Asking for scope=admin explicitly must not widen anything.
const forced = await download(guideA, "groups", "&scope=admin");
check("scope=admin in the query is ignored for a guide",
  forced.status === 200 && forced.rows.length === groupsA.rows.length,
  `${forced.rows.length} rows, same as the scoped export`);

console.log("\n=== L6: role gating ===");
const student = await login("manish.gupta1@example.edu");
const studentTry = await download(student, "students");
check("a student cannot export anything", studentTry.status === 403, studentTry.error);

const anon = await fetch(`${B}/api/reports/export?type=students`);
check("an anonymous request is refused", anon.status === 401);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
