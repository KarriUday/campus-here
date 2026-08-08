// Phase J: calendar extraction, reminder generation, cron dispatch.
import { readFile } from "node:fs/promises";

const B = "http://localhost:3000";
let cookie = "";

async function login(email) {
  const res = await fetch(`${B}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "Campus@123" }),
  });
  cookie = res.headers.getSetCookie().find((c) => c.startsWith("ch_session=")).split(";")[0];
}

async function api(path, options = {}) {
  const res = await fetch(`${B}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      Cookie: cookie,
      ...(options.headers ?? {}),
    },
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

let pass = 0, fail = 0;
const check = (label, ok, detail = "") => {
  if (ok) { pass++; console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ""}`); }
  else { fail++; console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`); }
};

await login("admin@example.edu");

console.log("\n=== J1: upload the real academic calendar PDF ===");
const PDF = "C:/Users/Jeevan/Downloads/CSE-VI & VII SEMESTER PROJECT DIARY 2024-25 and 2025-26 (2022 SCHEME) -march-2026.pdf";
const bytes = await readFile(PDF);
console.log(`        ${(bytes.length / 1024).toFixed(0)} KB`);

const form = new FormData();
form.set("file", new File([bytes], "project-diary-march-2026.pdf", { type: "application/pdf" }));
const upload = await api("/api/calendar", { method: "POST", body: form });

check("PDF upload returns 200", upload.status === 200, upload.body?.error);
check("text was extracted server-side", upload.body.extractedChars > 200,
  `${upload.body.extractedChars.toLocaleString()} characters`);

// This document is the project *diary and rubrics*, not a dated calendar: it
// contains "Review 1", "Phase I" and "30 Marks" but no calendar dates at all.
// Detecting nothing is the correct outcome — the detector must not invent a
// date from "30 Marks" or from a rubric heading.
check("no dates are invented from a document that has none",
  upload.body.events.length === 0,
  `${upload.body.events.length} detected from a rubrics document`);

console.log("\n=== J2: detection on a genuinely dated calendar ===");
const CALENDAR_TEXT = [
  "BMS INSTITUTE OF TECHNOLOGY AND MANAGEMENT",
  "Department of CSE - Academic Calendar 2026-27",
  "Last date for fee payment - 01 August 2026",
  "Major project review 0 (R0) - problem statement presentation - 12 September 2026",
  "Major project phase-1 (P1) review - 04-05 October 2026",
  "Internal assessment week - 20 October 2026",
  "Major project phase-2 (P2) review - 18 November 2026",
  "Project exhibition and viva - 05 December 2026",
].join("\n");

const pasted = await api("/api/calendar", {
  method: "POST",
  body: JSON.stringify({ text: CALENDAR_TEXT, filename: "academic-calendar-2026-27.txt" }),
});
check("pasted calendar returns 200", pasted.status === 200, pasted.body?.error);
console.log(`        detected ${pasted.body.events.length} review date(s):`);
for (const e of pasted.body.events) {
  console.log(`          ${e.eventDate}  ${e.phase.padEnd(6)} ${e.confidence.padEnd(6)} ${e.sourceLine.slice(0, 60)}`);
}
check("all four review milestones found", pasted.body.events.length === 4,
  pasted.body.events.map((e) => e.phase).join(", "));
check("phases are not shifted by the date's leading zero",
  pasted.body.events.map((e) => e.phase).join(",") === "R0,P1,P2,REVIEW");
check("the fee-payment and assessment lines are ignored",
  !pasted.body.events.some((e) => /fee|assessment/i.test(e.sourceLine)));

const state = await api("/api/calendar");
check("the import is stored with its raw text", Boolean(state.body.latest?.textPreview),
  `${state.body.latest?.filename}, ${state.body.latest?.extractedChars.toLocaleString()} chars`);

console.log("\n=== J3: reminders — both windows per event ===");
const generated = await api("/api/reminders", { method: "POST" });
check("generation returns 200", generated.status === 200, generated.body?.error);
if (generated.status === 200) {
  check("two reminders per detected event",
    generated.body.created === state.body.events.length * 2,
    `${generated.body.created} for ${state.body.events.length} events`);
}

const list = await api("/api/reminders");
const kinds = new Set(list.body.reminders.map((r) => r.kind));
check("both 15-day and 7-day windows exist",
  kinds.has("REVIEW_15_DAY") && kinds.has("REVIEW_7_DAY"),
  [...kinds].join(", "));

const sample = list.body.reminders[0];
check("reminder time is 09:00 local",
  new Date(sample.dueAt).getHours() === 9,
  `${new Date(sample.dueAt).toLocaleString("en-IN")}`);
check("body carries the source snippet",
  sample.body.includes("Source snippet:"), "");

console.log("\n=== J4: cron endpoint ===");
const noAuth = await fetch(`${B}/api/cron/reminders`);
check("cron rejects a request with no secret", noAuth.status === 401);

const wrongAuth = await fetch(`${B}/api/cron/reminders`, {
  headers: { Authorization: "Bearer wrong-secret" },
});
check("cron rejects a wrong secret", wrongAuth.status === 401);

const secret = process.env.CRON_SECRET;
const cronRes = await fetch(`${B}/api/cron/reminders`, {
  headers: { Authorization: `Bearer ${secret}` },
});
const cron = await cronRes.json();
check("cron accepts the correct secret", cronRes.status === 200, JSON.stringify(cron));
check("cron reports dry-run mode", cron.mode === "DRY_RUN");

console.log("\n=== J5: dispatched reminders are recorded, not faked ===");
const after = await api("/api/reminders");
const sent = after.body.reminders.filter((r) => r.status === "SENT");
check("due reminders moved to SENT", sent.length === cron.dispatched,
  `${sent.length} sent, cron reported ${cron.dispatched}`);

const rerun = await fetch(`${B}/api/cron/reminders`, {
  headers: { Authorization: `Bearer ${secret}` },
});
const second = await rerun.json();
check("a second run does not re-send", second.dispatched === 0,
  `considered ${second.considered}, dispatched ${second.dispatched}`);

console.log("\n=== J6: review scheduling with clash detection ===");
const groups = await api("/api/allocation");
const allocated = groups.body.allocations.filter((a) => a.status === "ALLOCATED").slice(0, 2);
const when = new Date(Date.now() + 7 * 86400000);
when.setHours(10, 0, 0, 0);

const first = await api("/api/reviews", {
  method: "POST",
  body: JSON.stringify({
    groupId: allocated[0].groupId, phase: "P1",
    scheduledAt: when.toISOString(), venue: "Seminar Hall 9", durationMinutes: 30,
  }),
});
check("first session schedules cleanly", first.status === 200, first.body?.error);

const clash = await api("/api/reviews", {
  method: "POST",
  body: JSON.stringify({
    groupId: allocated[1].groupId, phase: "P1",
    scheduledAt: new Date(when.getTime() + 10 * 60000).toISOString(),
    venue: "Seminar Hall 9", durationMinutes: 30,
  }),
});
check("an overlapping booking in the same room is refused with 409", clash.status === 409,
  clash.body?.error);

const forced = await api("/api/reviews", {
  method: "POST",
  body: JSON.stringify({
    groupId: allocated[1].groupId, phase: "P1",
    scheduledAt: new Date(when.getTime() + 10 * 60000).toISOString(),
    venue: "Seminar Hall 9", durationMinutes: 30, force: true,
  }),
});
check("an admin can override the clash deliberately", forced.status === 200,
  `${forced.body?.overriddenConflicts?.length ?? 0} clash(es) overridden`);

// The forced booking above runs +10..+40, so a truly back-to-back slot in
// this room starts at +40, not +30.
const backToBack = await api("/api/reviews", {
  method: "POST",
  body: JSON.stringify({
    groupId: allocated[0].groupId, phase: "P2",
    scheduledAt: new Date(when.getTime() + 40 * 60000).toISOString(),
    venue: "Seminar Hall 9", durationMinutes: 30,
  }),
});
check("a truly back-to-back slot in the same room is allowed", backToBack.status === 200,
  backToBack.body?.error);

console.log("\n=== J7: role gating ===");
await login("manish.gupta1@example.edu");
const studentCal = await api("/api/calendar");
check("a student cannot read the calendar admin API", studentCal.status === 403);
const studentGen = await api("/api/reminders", { method: "POST" });
check("a student cannot generate reminders", studentGen.status === 403);
const studentRead = await api("/api/reminders");
check("a student can read their reminders", studentRead.status === 200,
  `${studentRead.body.reminders.length} visible`);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
