// Phase H end-to-end invariant check against the running dev server.
const B = "http://localhost:3000";
const PASSWORD = "Campus@123";

const sessions = new Map();

async function login(email) {
  const res = await fetch(`${B}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`login failed for ${email}: ${res.status}`);
  const cookie = res.headers.getSetCookie().find((c) => c.startsWith("ch_session="));
  sessions.set(email, cookie.split(";")[0]);
  return email;
}

async function api(email, path, options = {}) {
  const res = await fetch(`${B}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Cookie: sessions.get(email),
      ...(options.headers ?? {}),
    },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    /* no body */
  }
  return { status: res.status, body };
}

let pass = 0;
let fail = 0;
function check(label, condition, detail = "") {
  if (condition) {
    pass++;
    console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ""}`);
  } else {
    fail++;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

const STUDENTS = [
  "dhruv.desai283@example.edu",
  "charan.acharya226@example.edu",
  "tejas.reddy250@example.edu",
  "shreya.srinivasan121@example.edu",
  "vedant.patel86@example.edu",
  "sanjana.menon34@example.edu",
];
const USNS = ["1BY23CS283", "1BY23CS226", "1BY23CS250", "1BY23CS121", "1BY23CS086", "1BY23CS034"];

console.log("\n=== H1: create a group ===");
for (const email of STUDENTS) await login(email);
await login("admin@example.edu");
const leader = STUDENTS[0];

let created = await api(leader, "/api/groups", { method: "POST" });
check("leader can create a group", created.status === 200, created.body?.group?.code ?? created.body?.error);
const groupId = created.body?.group?.id;
const groupCode = created.body?.group?.code;

const dup = await api(leader, "/api/groups", { method: "POST" });
check("creating a second group is refused", dup.status === 400, dup.body?.error);

console.log("\n=== H2: invites ===");
// Checked before any invites exist, so the capacity rule cannot mask it.
const selfInvite = await api(leader, `/api/groups/${groupId}/invite`, {
  method: "POST",
  body: JSON.stringify({ identifier: USNS[0] }),
});
check("inviting yourself is refused", selfInvite.status === 400, selfInvite.body?.error);

const unknownInvite = await api(leader, `/api/groups/${groupId}/invite`, {
  method: "POST",
  body: JSON.stringify({ identifier: "1BY23CS999" }),
});
check("inviting an unknown USN is refused", unknownInvite.status === 404, unknownInvite.body?.error);

const inviteIds = [];
for (const usn of USNS.slice(1, 4)) {
  const r = await api(leader, `/api/groups/${groupId}/invite`, {
    method: "POST",
    body: JSON.stringify({ identifier: usn }),
  });
  check(`invite ${usn}`, r.status === 200, r.body?.error ?? "sent");
  if (r.body?.invite) inviteIds.push(r.body.invite.id);
}

const overInvite = await api(leader, `/api/groups/${groupId}/invite`, {
  method: "POST",
  body: JSON.stringify({ identifier: USNS[4] }),
});
check(
  "a 4th invite is refused (1 member + 3 pending fills all 4 places)",
  overInvite.status === 400,
  overInvite.body?.error,
);

console.log("\n=== H3: accepting ===");
for (const i of [1, 2, 3]) {
  const invites = await api(STUDENTS[i], "/api/invites");
  const pending = invites.body.invites.find((inv) => inv.status === "PENDING");
  const r = await api(STUDENTS[i], `/api/invites/${pending.id}/accept`, { method: "POST" });
  check(`${USNS[i]} accepts`, r.status === 200, r.body?.error ?? `group now ${r.body?.group?.status}`);
}

// A fifth member must be impossible: invite from a different group, then accept.
console.log("\n=== H4: the group is full ===");
const forced = await api(leader, `/api/groups/${groupId}/invite`, {
  method: "POST",
  body: JSON.stringify({ identifier: USNS[4] }),
});
check(
  "cannot invite a 5th member into a full group",
  forced.status === 400,
  forced.body?.error,
);

const alreadyGrouped = await api(STUDENTS[1], "/api/groups", { method: "POST" });
check(
  "a student already in a group cannot create another",
  alreadyGrouped.status === 400,
  alreadyGrouped.body?.error,
);

console.log("\n=== H5: submit is blocked until everything is done ===");
let submit = await api(leader, `/api/groups/${groupId}/submit`, { method: "POST" });
check("submit refused with no domain/title/preferences", submit.status === 400, submit.body?.error);

const notLeader = await api(STUDENTS[1], `/api/groups/${groupId}/submit`, { method: "POST" });
check("a non-leader cannot submit", notLeader.status === 403, notLeader.body?.error);

console.log("\n=== H6: title + domain, with the duplicate block ===");
const settings = await api("admin@example.edu", "/api/settings");
const domainId = settings.body.domains.find((d) => d.isActive)?.id;

const blockedSave = await api(leader, "/api/titles", {
  method: "POST",
  body: JSON.stringify({
    groupId,
    title: "Smart Attendance Face Recognition",
    problemStatement: "Attempting to reuse an existing project.",
    domainId,
  }),
});
check(
  "saving a 100% duplicate title is refused with 409",
  blockedSave.status === 409,
  `${Math.round((blockedSave.body?.report?.score ?? 0) * 100)}% — ${blockedSave.body?.error}`,
);

const goodSave = await api(leader, "/api/titles", {
  method: "POST",
  body: JSON.stringify({
    groupId,
    title: "Tactile Wayfinding Beacons for Visually Impaired Commuters",
    problemStatement:
      "Deploy low-cost BLE beacons that trigger haptic guidance on a handheld device inside transit stations.",
    domainId,
  }),
});
check(
  "an original title saves",
  goodSave.status === 200,
  `${Math.round((goodSave.body?.report?.score ?? 0) * 100)}% similar`,
);

console.log("\n=== H7: preferences ===");
const faculty = await api(leader, "/api/faculty");
const guideIds = faculty.body.faculty.slice(0, 6).map((f) => f.id);

const tooFew = await api(leader, `/api/groups/${groupId}/preferences`, {
  method: "PUT",
  body: JSON.stringify({ facultyIds: guideIds.slice(0, 4) }),
});
check("fewer than 6 preferences is refused", tooFew.status === 400, tooFew.body?.error);

const duplicated = await api(leader, `/api/groups/${groupId}/preferences`, {
  method: "PUT",
  body: JSON.stringify({ facultyIds: [...guideIds.slice(0, 5), guideIds[0]] }),
});
check("a repeated guide is refused", duplicated.status === 400, duplicated.body?.error);

const prefsOk = await api(leader, `/api/groups/${groupId}/preferences`, {
  method: "PUT",
  body: JSON.stringify({ facultyIds: guideIds }),
});
check("6 distinct preferences save in rank order", prefsOk.status === 200,
  prefsOk.body?.preferences?.map((p) => p.rank).join(","));

console.log("\n=== H8: submit, then immutability ===");
submit = await api(leader, `/api/groups/${groupId}/submit`, { method: "POST" });
check("submit succeeds once complete", submit.status === 200, submit.body?.group?.status);

const lockedPrefs = await api(leader, `/api/groups/${groupId}/preferences`, {
  method: "PUT",
  body: JSON.stringify({ facultyIds: [...guideIds].reverse() }),
});
check("a locked group rejects preference edits", lockedPrefs.status === 400, lockedPrefs.body?.error);

const lockedTitle = await api(leader, "/api/titles", {
  method: "POST",
  body: JSON.stringify({ groupId, title: "A Totally Different Title Now", domainId }),
});
check("a locked group rejects title edits", lockedTitle.status === 400, lockedTitle.body?.error);

const lockedLeave = await api(STUDENTS[1], `/api/groups/${groupId}/leave`, { method: "POST" });
check("a locked group cannot be left", lockedLeave.status === 400, lockedLeave.body?.error);

console.log("\n=== H9: cross-group access ===");
const stranger = STUDENTS[5];
const strangerInvite = await api(stranger, `/api/groups/${groupId}/invite`, {
  method: "POST",
  body: JSON.stringify({ identifier: USNS[4] }),
});
check(
  "a non-member cannot invite into someone else's group",
  strangerInvite.status === 403,
  strangerInvite.body?.error,
);

const strangerTitle = await api(stranger, "/api/titles", {
  method: "POST",
  body: JSON.stringify({ groupId, title: "Hijacked Title", domainId }),
});
check(
  "a non-member cannot set someone else's title",
  strangerTitle.status === 403,
  strangerTitle.body?.error,
);

console.log("\n=== H10: average CGPA is arithmetic ===");
const mine = await api(leader, "/api/groups");
const members = mine.body.group.members.map((m) => Number(m.student.cgpa));
const expected = Math.round((members.reduce((a, b) => a + b, 0) / members.length) * 100) / 100;
check(
  "stored avgCgpa equals the mean of its members",
  Math.abs(Number(mine.body.group.avgCgpa) - expected) < 0.005,
  `stored ${mine.body.group.avgCgpa}, computed ${expected} from ${members.join(" / ")}`,
);

console.log(`\n${groupCode}: ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
