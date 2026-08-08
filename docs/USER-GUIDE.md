# User guide

Three roles, one sign-in page. You land on your own dashboard and can only see
your own section — the server enforces this, not the menu.

Common to every screen: the **cycle selector** in the navbar scopes everything
you see; **Detailed / Presentation** changes how much of the sidebar is shown;
**Share link** copies the current screen's URL with the cycle pinned into it.

---

## Coordinator (Admin)

### Getting a cycle started

1. **Data Ingestion** — upload the student CSV. Required columns: `usn`,
   `name` (or `full_name`), `cgpa`, `email`; `phone` optional. Press
   **Validate** first: it shows exactly which rows would be written and which
   were rejected and why, and writes nothing. Press **Apply import** when the
   preview looks right.
   *A student who already exists is enrolled into this cycle rather than
   duplicated — one person keeps one login across Major, Mini and Internship.*
2. Upload the **faculty CSV** the same way. Separate multiple domains with a
   semicolon (`AI/ML;Data Science`). Capacity defaults to 2 groups per guide.
3. Upload **previous project titles** — one per line, or a CSV. This seeds the
   corpus that duplicate detection scores against, so do it before students
   start submitting.
4. **Settings** — check the domain list and the per-designation capacity caps.
   The allocation engine reads both.

### Running the allocation

Open **Allocation** once groups have submitted.

- **Preview** computes the matching and writes nothing. It reports whether the
  result is stable, how many groups got each choice, and who could not be
  placed.
- **Run & commit** writes it, inside a single transaction.
- Anything in the **unallocated queue** can be assigned by hand. A manual
  assignment is locked: later runs will not move it.

Re-running with unchanged data produces an identical matching, so it is safe to
preview as often as you like.

### Scheduling reviews

**Calendar PDF → Reminders**: upload the academic calendar. Text is extracted
on the server. If nothing is detected the PDF is probably a scan with no text
layer — paste the text into the box instead. Then **Generate reminders**, which
creates a 15-day and a 7-day reminder for every detected date, dispatched at
09:00.

**Reviews & Scheduling**: book R0, P1 and P2 per group. If the slot clashes with
another booking for the same guide or the same room you are told before it
saves, and can override deliberately.

### Reports

**Reports & Exports** has nine workbooks. Each opens with a frozen, filtered
header row and an About sheet recording who generated it and when.

---

## Student

### Forming a group

1. **Invites → Create a group** (or accept an invite someone sent you).
2. Search the unattached pool and invite up to enough people to reach four.
   You cannot over-invite: members plus outstanding invites can never exceed
   the group size.
3. **Accepting one invite automatically declines your others.**

**My Group** shows a five-item checklist of everything needed before the leader
can submit. Each unfinished item links to the screen that fixes it.

### Choosing a title

**Domain & Problem Statement**: pick a domain, then type your title. It is
scored live against every registered and previously imported title.

| What you see | What it means |
|---|---|
| **Original** (green) | nothing sufficiently similar exists |
| **Close match** (amber) | similar work exists; you may proceed, and your guide will see the score |
| **Blocked** (red) | effectively the same project as one already registered — Save is disabled |

Below the verdict are the five closest titles, each with its individual signal
scores and the exact words that matched, so you can see *why* it was flagged
rather than just being told no.

Filler words are ignored: *"Smart Attendance System"* and *"Attendance"* are the
same title as far as the check is concerned, and `ML` is treated as *machine
learning*.

### Preferences and submission

**Guide Preferences** — rank exactly six distinct guides. Choosing one disables
it in the other five. Guides who teach your domain are listed first, because
the allocation engine prefers a domain match.

When the leader presses **Submit & lock**, the group is frozen: membership,
domain, title, statement and preferences can no longer change. That is what
makes the allocation reproducible, so submit only when you are sure.

### Afterwards

**Review Timeline** shows R0 → P1 → P2 with any scores and remarks recorded.
**Reminders** lists your review reminders. **Notifications** is your inbox; it
updates live, falling back to polling if the live connection drops.

---

## Guide (Faculty)

**Assigned Groups** lists the groups allocated to you with full contact details
for every member, and a one-click roster export.

**Review Sessions** is your schedule, showing which sessions still need
attendance or marks.

**Mark Attendance** — choose a session, toggle each student present or absent,
save. Saving marks the session completed. Export per session or cumulatively.

**Evaluate Groups** — a score out of 10 and remarks, saved per group per phase.
Saving again updates the existing entry.

**Title Approval** — approve a title to register it, or send it back with a
reason. You see the originality score and the matched words alongside. You can
only act on groups you guide.

**Mail Center** — email the students in your groups. Everyone is BCC'd, so they
never see each other's addresses. Attachments up to 20MB in total.

> **Dry-run mode.** Unless the department has configured live credentials, the
> system is in dry run: messages are fully recorded and students still receive
> the in-app notification, but nothing leaves the server. The banner tells you
> which mode you are in, and a dry run is never reported as delivered.

You may store your own Gmail app password under **Transport**. It is encrypted
before storage and never shown again — not even to you.

**Orientation** — post a text or audio briefing that appears on your students'
dashboards. Text posts can be read aloud in the browser. You can delete only
what you posted.

---

## Signing in and passwords

Seeded demo accounts share the password in `SEED_PASSWORD` (default
`Campus@123`). Accounts created by a CSV import get `DEFAULT_IMPORT_PASSWORD`.
**Both should be changed before real use.**

Forgot your password? The link is on the sign-in page. The reset link is
single-use and expires in 30 minutes. For security the page gives the same
response whether or not the address is registered.
