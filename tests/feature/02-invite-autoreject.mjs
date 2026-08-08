// The prototype's Invites screen promised "Accepting one validates it and
// removes others" and never implemented it. This proves it now happens.
const B = "http://localhost:3000";
const sessions = new Map();

async function login(email) {
  const res = await fetch(`${B}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "Campus@123" }),
  });
  if (!res.ok) throw new Error(`login ${email}: ${res.status}`);
  sessions.set(
    email,
    res.headers.getSetCookie().find((c) => c.startsWith("ch_session=")).split(";")[0],
  );
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
  return { status: res.status, body: await res.json().catch(() => null) };
}

// Two ungrouped students found via the admin roster, plus a third to be
// fought over by both.
await login("admin@example.edu");
const roster = await api("admin@example.edu", "/api/students?grouped=no&page=1");
const pool = roster.body.students;
const [a, b, prize] = pool;
console.log(`leaders: ${a.usn}, ${b.usn}; contested: ${prize.usn}\n`);

for (const s of [a, b, prize]) await login(s.email);

const g1 = await api(a.email, "/api/groups", { method: "POST" });
const g2 = await api(b.email, "/api/groups", { method: "POST" });
console.log(`group A = ${g1.body.group.code}, group B = ${g2.body.group.code}`);

await api(a.email, `/api/groups/${g1.body.group.id}/invite`, {
  method: "POST",
  body: JSON.stringify({ identifier: prize.usn }),
});
await api(b.email, `/api/groups/${g2.body.group.id}/invite`, {
  method: "POST",
  body: JSON.stringify({ identifier: prize.usn }),
});

const before = await api(prize.email, "/api/invites");
const pending = before.body.invites.filter((i) => i.status === "PENDING");
console.log(`\n${prize.usn} now has ${pending.length} pending invite(s): ${pending.map((i) => i.group.code).join(", ")}`);

const accepted = await api(prize.email, `/api/invites/${pending[0].id}/accept`, {
  method: "POST",
});
console.log(`accepted ${pending[0].group.code} -> ${accepted.status}, autoRejected=${accepted.body.autoRejected}`);

const after = await api(prize.email, "/api/invites");
for (const invite of after.body.invites) {
  console.log(`  ${invite.group.code}: ${invite.status}`);
}

const stillPending = after.body.invites.filter((i) => i.status === "PENDING").length;
const rejected = after.body.invites.filter((i) => i.status === "REJECTED").length;

let pass = 0;
let fail = 0;
const check = (label, ok, detail = "") => {
  if (ok) { pass++; console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ""}`); }
  else { fail++; console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`); }
};

console.log("\n=== accepting one invite declines the rest ===");
check("accept returns 200", accepted.status === 200);

// Every other pending invite must be declined, however many there were.
const expectedAutoRejected = pending.length - 1;
check(
  "the other pending invites were auto-declined",
  accepted.body.autoRejected === expectedAutoRejected,
  `reported ${accepted.body.autoRejected}, expected ${expectedAutoRejected}`,
);
check("no invite is left pending", stillPending === 0, `${stillPending} pending`);
check(
  "the declined invites are recorded as REJECTED",
  rejected === expectedAutoRejected,
  `${rejected} rejected`,
);

// The group whose invite was auto-declined must not have gained the member.
const declinedCode = after.body.invites.find((i) => i.status === "REJECTED").group.code;
const declinedLeader = g1.body.group.code === declinedCode ? a.email : b.email;
const declinedGroup = await api(declinedLeader, "/api/groups");
const hasPrize = declinedGroup.body.group.members.some(
  (m) => m.student.usn === prize.usn,
);
check(
  `the declined group ${declinedCode} did not gain the member`,
  !hasPrize,
  `size ${declinedGroup.body.group.members.length}, expected 1`,
);

console.log(`\n${pass} passed, ${fail} failed\n`);

process.exit(fail === 0 ? 0 : 1);
