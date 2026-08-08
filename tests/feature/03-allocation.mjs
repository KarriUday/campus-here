// Phase I: allocation engine against the seeded cohort.
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
    headers: { "Content-Type": "application/json", Cookie: cookie, ...(options.headers ?? {}) },
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

let pass = 0, fail = 0;
const check = (label, ok, detail = "") => {
  if (ok) { pass++; console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ""}`); }
  else { fail++; console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`); }
};

await login("admin@example.edu");

console.log("\n=== I1: preview writes nothing ===");
const before = await api("/api/allocation");
const beforeAllocated = before.body.allocations.filter((a) => a.status === "ALLOCATED").length;

const preview = await api("/api/allocation/run", {
  method: "POST",
  body: JSON.stringify({ dryRun: true }),
});
check("preview returns 200", preview.status === 200);
check("preview reports a stable matching", preview.body.stable === true);
console.log(
  `        ${preview.body.stats.groupsConsidered} groups, ${preview.body.stats.facultyConsidered} guides, ` +
    `${preview.body.stats.allocated} matched, ${preview.body.stats.unallocated} unallocated, ` +
    `${preview.body.stats.proposals} proposals`,
);
console.log(`        choice histogram: ${JSON.stringify(preview.body.stats.rankHistogram)}`);

const afterPreview = await api("/api/allocation");
const afterPreviewAllocated = afterPreview.body.allocations.filter((a) => a.status === "ALLOCATED").length;
check("nothing was written by the preview", afterPreviewAllocated === beforeAllocated,
  `${beforeAllocated} before, ${afterPreviewAllocated} after`);

console.log("\n=== I2: commit ===");
const committed = await api("/api/allocation/run", {
  method: "POST",
  body: JSON.stringify({ dryRun: false }),
});
check("commit returns 200", committed.status === 200, `run ${committed.body.runId}`);
check("commit matches the preview's allocated count",
  committed.body.stats.allocated === preview.body.stats.allocated,
  `preview ${preview.body.stats.allocated}, commit ${committed.body.stats.allocated}`);

const state = await api("/api/allocation");
const allocated = state.body.allocations.filter((a) => a.status === "ALLOCATED");
const unallocated = state.body.allocations.filter((a) => a.status === "UNALLOCATED");
check("database reflects the run", allocated.length === committed.body.stats.allocated,
  `${allocated.length} allocated, ${unallocated.length} unallocated`);

console.log("\n=== I3: capacity is never exceeded ===");
const perGuide = new Map();
for (const row of allocated) perGuide.set(row.guide, (perGuide.get(row.guide) ?? 0) + 1);
const faculty = await api("/api/faculty");
const capacityById = new Map(faculty.body.faculty.map((f) => [f.fullName, f.capacity]));
let over = [];
for (const [guide, count] of perGuide) {
  const cap = capacityById.get(guide) ?? 2;
  if (count > cap) over.push(`${guide}: ${count} > ${cap}`);
}
check("no guide holds more groups than their capacity", over.length === 0,
  over.length ? over.join("; ") : `max held = ${Math.max(...perGuide.values())}`);

console.log("\n=== I4: idempotent re-run ===");
const second = await api("/api/allocation/run", { method: "POST", body: JSON.stringify({ dryRun: false }) });
const stateB = await api("/api/allocation");
const pairsA = allocated.map((a) => `${a.groupCode}->${a.guide}`).sort().join("|");
const pairsB = stateB.body.allocations.filter((a) => a.status === "ALLOCATED")
  .map((a) => `${a.groupCode}->${a.guide}`).sort().join("|");
check("re-running identical data produces an identical matching", pairsA === pairsB,
  `${second.body.stats.allocated} matched again`);

console.log("\n=== I5: scarcity produces a real unallocated queue ===");
// 40 guides x 2 places seats 55 groups comfortably, so squeeze capacity to 1
// through the Settings API — which also exercises the capacity-rule wiring.
for (const designation of ["ASSISTANT_PROFESSOR", "ASSOCIATE_PROFESSOR", "PROFESSOR"]) {
  await api("/api/settings", {
    method: "PATCH",
    body: JSON.stringify({ capacityRule: { designation, maxGroups: 1, applyToExisting: true } }),
  });
}
const scarce = await api("/api/allocation/run", { method: "POST", body: JSON.stringify({ dryRun: false }) });
check("with 1 place per guide, some groups cannot be placed",
  scarce.body.stats.unallocated > 0,
  `${scarce.body.stats.allocated} matched, ${scarce.body.stats.unallocated} unallocated across 40 places`);
check("allocated never exceeds total capacity", scarce.body.stats.allocated <= 40,
  `${scarce.body.stats.allocated} <= 40`);

const scarceState = await api("/api/allocation");
const scarceUnalloc = scarceState.body.allocations.filter((a) => a.status === "UNALLOCATED");
check("unallocated rows carry a reason",
  scarceUnalloc.length > 0 && scarceUnalloc.every((r) => r.unallocatedReason),
  scarceUnalloc[0]?.unallocatedReason);

console.log("\n=== I6: manual override ===");
const facultyScarce = await api("/api/faculty");
const stillUnallocated = scarceUnalloc;
if (stillUnallocated.length === 0) {
  check("expected an unallocated group to override", false, "queue was empty");
} else {
  const target = stillUnallocated[0];
  const freeGuide = facultyScarce.body.faculty.find((f) => f.available > 0);
  const manual = await api("/api/allocation/manual", {
    method: "POST",
    body: JSON.stringify({ groupId: target.groupId, facultyId: freeGuide.id }),
  });
  check("manual assignment succeeds", manual.status === 200,
    `${target.groupCode} -> ${freeGuide.fullName}`);

  const third = await api("/api/allocation/run", { method: "POST", body: JSON.stringify({ dryRun: false }) });
  const stateC = await api("/api/allocation");
  const kept = stateC.body.allocations.find((a) => a.groupId === target.groupId);
  check("a later run does not undo the manual assignment",
    kept?.method === "MANUAL" && kept?.guideId === freeGuide.id,
    `still ${kept?.method} -> ${kept?.guide}`);
  check("the run reports the manual assignment as locked",
    third.body.stats.locked >= 1, `locked=${third.body.stats.locked}`);

  // Over-capacity manual assignment must be refused.
  const nowFaculty = await api("/api/faculty");
  const fullGuide = nowFaculty.body.faculty.find((f) => f.available === 0);
  if (fullGuide && stillUnallocated[1]) {
    const refused = await api("/api/allocation/manual", {
      method: "POST",
      body: JSON.stringify({ groupId: stillUnallocated[1].groupId, facultyId: fullGuide.id }),
    });
    check("assigning to a guide at capacity is refused", refused.status === 400, refused.body?.error);
  }
}

console.log("\n=== I7: run history ===");
const runs = await api("/api/allocation/runs");
check("history records every run", runs.body.runs.length >= 3, `${runs.body.runs.length} runs`);
check("history records the tie-break parameters",
  Array.isArray(runs.body.runs[0]?.params?.tieBreak),
  JSON.stringify(runs.body.runs[0]?.params?.tieBreak));

console.log("\n=== I7: role gating ===");
await login("manish.gupta1@example.edu");
const forbidden = await api("/api/allocation/run", { method: "POST", body: JSON.stringify({ dryRun: true }) });
check("a student cannot run allocation", forbidden.status === 403, forbidden.body?.error);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
