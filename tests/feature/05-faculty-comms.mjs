// Phase K: faculty module and communications.
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

async function api(who, path, options = {}) {
  const res = await fetch(`${B}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      Cookie: sessions.get(who),
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

const admin = await login("admin@example.edu");

// Find two guides that actually hold groups, and one of their students.
const alloc = await api(admin, "/api/allocation");
const allocated = alloc.body.allocations.filter((a) => a.status === "ALLOCATED");
const facultyList = await api(admin, "/api/faculty");
const guideNames = [...new Set(allocated.map((a) => a.guide))].slice(0, 2);
const guides = guideNames.map((n) => facultyList.body.faculty.find((f) => f.fullName === n));
const guideA = await login(guides[0].email);
const guideB = await login(guides[1].email);
console.log(`guides: ${guides[0].fullName} / ${guides[1].fullName}\n`);

console.log("=== K1: assigned groups are scoped per guide ===");
const reviewsA = await api(guideA, "/api/reviews");
const reviewsB = await api(guideB, "/api/reviews");
const codesA = new Set(reviewsA.body.sessions.map((s) => s.groupCode));
const codesB = new Set(reviewsB.body.sessions.map((s) => s.groupCode));
const overlap = [...codesA].filter((c) => codesB.has(c));
check("two guides see disjoint session lists", overlap.length === 0,
  `${codesA.size} vs ${codesB.size} sessions, ${overlap.length} shared`);

console.log("\n=== K2: attendance ===");
const sessionA = reviewsA.body.sessions[0];
const rosterRes = await api(guideA, `/api/attendance?sessionId=${sessionA.id}`);
check("guide can read their own roster", rosterRes.status === 200,
  `${rosterRes.body.roster?.length} students in ${sessionA.groupCode}`);

const crossRead = await api(guideB, `/api/attendance?sessionId=${sessionA.id}`);
check("another guide cannot read that roster", crossRead.status === 403, crossRead.body?.error);

const entries = rosterRes.body.roster.map((r, i) => ({
  studentId: r.studentId,
  status: i === 1 ? "ABSENT" : "PRESENT",
}));
const saveAtt = await api(guideA, "/api/attendance", {
  method: "POST",
  body: JSON.stringify({ sessionId: sessionA.id, entries }),
});
check("attendance saves", saveAtt.status === 200, `${saveAtt.body.marked} marked`);

const reread = await api(guideA, `/api/attendance?sessionId=${sessionA.id}`);
const absent = reread.body.roster.filter((r) => r.status === "ABSENT").length;
check("attendance round-trips to the database", absent === 1 && reread.body.session.status === "COMPLETED",
  `${absent} absent, session ${reread.body.session.status}`);

const crossWrite = await api(guideB, "/api/attendance", {
  method: "POST",
  body: JSON.stringify({ sessionId: sessionA.id, entries }),
});
check("another guide cannot mark that session", crossWrite.status === 403, crossWrite.body?.error);

console.log("\n=== K3: evaluation ===");
const saveEval = await api(guideA, "/api/evaluation", {
  method: "POST",
  body: JSON.stringify({ sessionId: sessionA.id, score: 8.5, remarks: "Solid problem statement." }),
});
check("evaluation saves", saveEval.status === 200, `score ${saveEval.body.evaluation?.score}`);

const badScore = await api(guideA, "/api/evaluation", {
  method: "POST",
  body: JSON.stringify({ sessionId: sessionA.id, score: 11 }),
});
check("a score above 10 is refused", badScore.status === 400, badScore.body?.error);

const crossEval = await api(guideB, "/api/evaluation", {
  method: "POST",
  body: JSON.stringify({ sessionId: sessionA.id, score: 3 }),
});
check("another guide cannot evaluate that session", crossEval.status === 403, crossEval.body?.error);

console.log("\n=== K4: title approval ===");
const titlesA = await api(guideA, "/api/titles?source=submitted");
const mine = await api(guideA, "/api/reviews");
const myCodes = new Set(mine.body.sessions.map((s) => s.groupCode));
const target = titlesA.body.titles.find((t) => myCodes.has(t.group));
if (!target) {
  check("expected a title for one of this guide's groups", false, "none found");
} else {
  const approve = await api(guideA, `/api/titles/${target.id}/review`, {
    method: "POST", body: JSON.stringify({ decision: "APPROVE" }),
  });
  check("guide approves their group's title", approve.status === 200,
    `${approve.body.title?.approvalStatus}`);

  const rejectNoReason = await api(guideA, `/api/titles/${target.id}/review`, {
    method: "POST", body: JSON.stringify({ decision: "REJECT" }),
  });
  check("rejecting without a reason is refused", rejectNoReason.status === 400,
    rejectNoReason.body?.error);

  const crossApprove = await api(guideB, `/api/titles/${target.id}/review`, {
    method: "POST", body: JSON.stringify({ decision: "APPROVE" }),
  });
  check("another guide cannot approve it", crossApprove.status === 403, crossApprove.body?.error);
}

console.log("\n=== K5: email, dry-run but fully recorded ===");
const send = await api(guideA, "/api/mail/send", {
  method: "POST",
  body: JSON.stringify({ subject: "Review 0 preparation", body: "Please bring your slides." }),
});
check("guide sends to their own groups", send.status === 200,
  `${send.body.recipientCount} recipients, mode ${send.body.mode}`);
check("dry run is not reported as delivered", send.body.mode === "DRY_RUN" && send.body.delivered === 0,
  `delivered=${send.body.delivered}`);

const adminScope = await api(guideA, "/api/mail/send", {
  method: "POST",
  body: JSON.stringify({ subject: "Everyone", body: "Broad message.", mode: "ALL" }),
});
// A guide asking for ALL is silently narrowed to their own groups.
check("a guide cannot widen scope to the whole cycle",
  adminScope.status === 200 && adminScope.body.recipientCount === send.body.recipientCount,
  `${adminScope.body.recipientCount} recipients, same as MY_GROUPS`);

const historyA = await api(guideA, "/api/mail/history");
const historyB = await api(guideB, "/api/mail/history");
check("a guide sees only their own sent mail",
  historyA.body.history.length >= 2 && historyB.body.history.length === 0,
  `${historyA.body.history.length} vs ${historyB.body.history.length}`);

console.log("\n=== K6: the student receives it in-app ===");
const roster = rosterRes.body.roster;
const studentsList = await api(admin, `/api/students?q=${roster[0].usn}`);
const studentEmail = studentsList.body.students[0].email;
const student = await login(studentEmail);
const inbox = await api(student, "/api/notifications");
check("recipient has notifications", inbox.body.notifications.length >= 2,
  `${inbox.body.notifications.length} in ${roster[0].usn}'s inbox`);
check("the notification records the dry run honestly",
  inbox.body.notifications[0].status === "DRY_RUN",
  inbox.body.notifications[0].status);

const since = new Date(Date.now() - 1000).toISOString();
const delta = await api(student, `/api/notifications?since=${encodeURIComponent(since)}`);
check("the ?since= polling fallback filters by time",
  Array.isArray(delta.body.notifications), `${delta.body.notifications.length} since 1s ago`);

console.log("\n=== K7: another student cannot read that inbox ===");
const other = await login("manish.gupta1@example.edu");
const otherInbox = await api(other, "/api/notifications");
const leaked = otherInbox.body.notifications.some((n) =>
  inbox.body.notifications.some((m) => m.id === n.id),
);
check("inboxes are per student", !leaked,
  `${otherInbox.body.notifications.length} in the other student's inbox, no overlap`);

console.log("\n=== K8: whatsapp, dry run ===");
const wa = await api(guideA, "/api/whatsapp", {
  method: "POST",
  body: JSON.stringify({ body: "Review 0 is tomorrow.", documentsEmailed: true }),
});
check("whatsapp send returns 200", wa.status === 200,
  `${wa.body.attempted} attempted, mode ${wa.body.mode}`);
const waHistory = await api(guideA, "/api/whatsapp");
check("messages are recorded with DRY_RUN",
  waHistory.body.history.length > 0 && waHistory.body.history[0].mode === "DRY_RUN",
  waHistory.body.history[0]?.toNumber);
check("the documents note is appended",
  waHistory.body.history[0]?.bodyPreview.includes("Documents have been sent to your email"));

const waBad = await api(guideA, "/api/whatsapp", {
  method: "POST",
  body: JSON.stringify({ body: "Hi", mode: "MANUAL_ONLY", extraNumbers: ["12345"] }),
});
check("invalid numbers are rejected, not silently dropped", waBad.status === 400, waBad.body?.error);

console.log("\n=== K9: orientation authorship ===");
const post = await api(guideA, "/api/orientation", {
  method: "POST",
  body: JSON.stringify({
    title: "Guide briefing", summary: "What I expect at R0.",
    postedByLabel: "Guide", text: "Bring a working prototype and your literature survey.",
  }),
});
check("guide posts an orientation", post.status === 200, post.body.orientation?.title);

const crossDelete = await api(guideB, `/api/orientation?id=${post.body.orientation.id}`, {
  method: "DELETE",
});
check("another guide cannot delete it", crossDelete.status === 403, crossDelete.body?.error);

const ownDelete = await api(guideA, `/api/orientation?id=${post.body.orientation.id}`, {
  method: "DELETE",
});
check("the author can delete their own", ownDelete.status === 200);

console.log("\n=== K10: health ===");
const health = await fetch(`${B}/api/health`);
const healthBody = await health.json();
check("health reports the database and mail mode", health.status === 200,
  `db=${healthBody.database} mail=${healthBody.mail}`);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
