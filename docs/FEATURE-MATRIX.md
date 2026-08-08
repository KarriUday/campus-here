# Feature matrix (§9 compliance)

§9 requires that, for every module in §3, the build states **which API routes
implement it, which Prisma models it reads and writes, and that it was
exercised against the real backend** — not a stub.

This table is filled in from actual runs. The "Verified" column cites checks
that were executed, not intentions. Nothing in the application writes to
component state or `localStorage` in place of the database.

**Totals:** 121 unit tests · 129 API-level checks across phases F–L · 18
browser-driven checks · `npm run verify` green.

---

## §3.1 Authentication

| | |
|---|---|
| **Routes** | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` |
| **Models** | reads/writes `User` (`passwordHash`, `lastLoginAt`, `resetTokenHash`, `resetTokenExpiry`); reads `Student`, `Faculty` for the session's linked ids |
| **Verified** | All three roles sign in and land on their own dashboard (browser). 401 with no cookie; 401 on wrong password; 401 on unknown address; 401 again after logout. A student hitting `/admin` or `/faculty/*` is redirected to `/student`; anonymous → `/login?next=%2Fadmin%2Fstudents`. |

## §3.2 Admin dashboard and data ingestion

| | |
|---|---|
| **Routes** | `POST /api/students/upload`, `GET/DELETE /api/students`, `POST /api/faculty/upload`, `GET/PATCH /api/faculty`, `POST /api/titles/import`, `GET/POST/PATCH /api/settings`, `GET /api/samples` |
| **Models** | writes `Student`, `User`, `StudentCycle`, `Faculty`, `Domain`, `ProjectTitle`, `ImportBatch`, `CapacityRule`; reads `ProjectCycle`, `Group`, `Allocation` |
| **Verified** | A 306-row CSV previewed 300 valid / 6 rejected with the expected per-row messages and **wrote nothing**; applying it created 300 students (300 → 600); re-applying was rejected wholesale as duplicates with the count unchanged. A multipart faculty upload created 2 guides and rejected an unknown designation. A capacity-rule change updated 10 guides. Clearing the roster removed 600 enrolments and 71 groups while the accounts still signed in. |

## §3.3 Group formation

| | |
|---|---|
| **Routes** | `GET/POST /api/groups`, `POST /api/groups/[id]/invite`, `/leave`, `/submit`, `PUT /api/groups/[id]/preferences`, `GET /api/invites`, `POST /api/invites/[id]/accept`, `/reject`, `GET /api/students/available` |
| **Models** | writes `Group`, `GroupMember`, `GroupInvite`, `GuidePreference`; reads `Student`, `StudentCycle`, `ProjectCycle`, `Faculty` |
| **Verified** | 27 invariant checks: a second group refused; self-invite and unknown USN refused; a fourth invite refused once members + pending fill the group; a fifth member impossible; submit refused while incomplete and refused for a non-leader; a locked group rejects preference, title and membership edits; non-members cannot invite into or retitle another group; stored `avgCgpa` equals the mean of its members (6.37 from 6.4/6.39/6.36/6.33). Separately: a student holding **three** pending invites accepted one and the other two were auto-declined. |

## §3.4 Title originality

| | |
|---|---|
| **Routes** | `POST /api/titles/check`, `GET/POST /api/titles`, `POST /api/titles/import` |
| **Models** | reads/writes `ProjectTitle` (`normalizedTitle`, `similarityScore`, `similarityReport`); reads `Domain`, `Group`, `ProjectCycle` |
| **Verified** | 23 unit tests including the report's own case. Live against the seeded 70-title corpus: *"Smart Attendance Face Recognition"* → **100% BLOCKED**; a reordering → 100%; *"Adaptive Study Planner using Machine Learning"* vs the corpus's `…using ML` → 100%; *"Face Recognition for Library Access"* → 58% ALLOWED; *"Quantum Error Correction for Satellite Links"* → 12% ALLOWED. Saving a blocked title returns **409** even when the client ignores the warning. In the browser, typing the duplicate showed the blocked verdict and **disabled Save**. |

## §3.5 Guide allocation

| | |
|---|---|
| **Routes** | `POST /api/allocation/run`, `POST /api/allocation/manual`, `GET /api/allocation`, `GET /api/allocation/runs` |
| **Models** | writes `Allocation`, `AllocationRun`, `Group.status`; reads `GuidePreference`, `Faculty`, `Domain`, `CapacityRule` |
| **Verified** | 18 unit tests including a 75-group / 40-guide cohort verified free of blocking pairs. Live: preview wrote nothing; commit matched the preview exactly at 55 groups with **43 receiving their first choice** and 74 proposals; no guide exceeded capacity; re-running produced an identical matching; squeezing capacity to 1 left **16 unallocated** with `ALL_PREFERENCES_FULL`; a manual assignment survived two later runs and was reported `locked: 1`; assigning to a full guide was refused. Run history records the tie-break parameters. |

## §3.6 Review calendar, scheduling and reminders

| | |
|---|---|
| **Routes** | `GET/POST /api/calendar`, `DELETE /api/calendar/events/[id]`, `GET/POST /api/reminders`, `GET /api/reviews`, `POST /api/reviews`, `GET /api/cron/reminders` |
| **Models** | writes `CalendarImport`, `CalendarEvent`, `Reminder`, `ReviewSession`, `UploadedFile`, `EmailMessage`, `Notification`; reads `ProjectCycle`, `Group`, `Allocation` |
| **Verified** | The department's real 678 KB project diary extracted 20,743 characters and correctly detected **zero** dates — it is a rubrics template with none, and the detector did not invent any. A genuinely dated calendar yielded all four milestones as R0/P1/P2/REVIEW with no phase shift, ignoring the fee-payment and assessment lines. 16 reminders across 8 events, both windows, at 09:00 local. Cron rejected a missing and a wrong secret, accepted the right one, dispatched in DRY_RUN, and a second run re-sent nothing. Scheduling: an overlapping room booking returned 409, `force` overrode it, a truly back-to-back slot was allowed. |

## §3.7 Faculty module

| | |
|---|---|
| **Routes** | `GET /api/reviews`, `GET/POST /api/attendance`, `GET/POST /api/evaluation`, `POST /api/titles/[id]/review`, `GET/POST/DELETE /api/orientation` |
| **Models** | writes `Attendance`, `Evaluation`, `ProjectTitle.approvalStatus`, `Orientation`, `ReviewSession.status`; reads `Allocation`, `Group`, `GroupMember`, `Student` |
| **Verified** | Two guides see disjoint session lists. A guide cannot read, mark, evaluate or approve another guide's session or title (403 each). Attendance persisted with the session flipped to `COMPLETED`; a score above 10 refused; rejecting a title without a reason refused; orientation deletion refused for a non-author and allowed for the author. |

## §3.8 Communication

| | |
|---|---|
| **Routes** | `POST /api/mail/send`, `GET /api/mail/history`, `GET/POST/PUT/DELETE /api/mail/config`, `GET/POST /api/whatsapp`, `GET/PATCH /api/notifications`, `GET /api/notifications/stream`, `GET /api/health` |
| **Models** | writes `EmailMessage`, `Notification`, `WhatsAppMessage`, `Faculty.smtpUserEnc/smtpPassEnc`; reads `Student`, `Group`, `Allocation` |
| **Verified** | A guide's send resolved to their own 8 students; asking for the whole cycle was narrowed to the same 8. Dry run recorded `mode=DRY_RUN` with `delivered=0` — **never reported as delivered**. Mail history is per sender (2 vs 0). The recipient's inbox showed the message with status `DRY_RUN` while another student's inbox stayed empty. WhatsApp recorded DRY_RUN rows, appended the documents note, and rejected invalid numbers rather than dropping them. SMTP credentials round-trip through AES-256-GCM and a tampered ciphertext fails closed (6 unit tests). |

## §3.9 Reviews, attendance, evaluation

Covered by §3.6 (scheduling) and §3.7 (recording). The admin
`Attendance & Evaluation` screen is a read-only view over the same
`ReviewSession`, `Attendance` and `Evaluation` rows, with exports.

## §3.10 and §10 Reports and Excel

| | |
|---|---|
| **Routes** | `GET /api/reports/export?type=&sessionId=` |
| **Models** | reads `Student`, `Group`, `GroupMember`, `Allocation`, `ReviewSession`, `Attendance`, `Evaluation`, `ProjectTitle`, `Reminder`, `Faculty`, `Domain` |
| **Verified** | All nine reports download and re-parse as genuine workbooks (300-row student list; 36-column cumulative attendance). The header row comes back **bold, filled `FFC026D3`, frozen and filtered**, with sized columns and an About sheet. Two guides export **disjoint** group sets and every row in a guide's export names that guide. The four cycle-wide reports return 403 for faculty. `scope=admin` in the query changes nothing. Students 403, anonymous 401. Clicking Download in the browser produced `students-2025-26-major-projects.xlsx`. |

## §10 export placement

§10 asks for export power wherever faculty already look at data, not one buried
page. Delivered:

| Screen | Export |
|---|---|
| Faculty → Assigned Groups | full roster (USN, name, email, phone, CGPA, group, title, domain) |
| Faculty → Mark Attendance | per-session **and** cumulative |
| Faculty → Evaluate Groups | scores and remarks |
| Faculty → Title Approval | titles with similarity scores |
| Admin → Reports & Exports | all nine, cycle-wide |
| Admin → Attendance & Evaluation | attendance, cumulative, evaluations |

---

## Nothing is mocked

Every claim above was produced by running the code against PostgreSQL. Specific
prototype gaps that are now real:

| Prototype | Now |
|---|---|
| `0.82` / `82%` typed as strings | TF-IDF cosine plus four lexical signals, computed server-side |
| Allocation screen labelled "In build" | Gale-Shapley in a serializable transaction, stability-checked |
| "Upload faculty list" with no file input | full CSV validator and importer |
| `avgCgpa` typed as `"9.12"` | Decimal recomputed on every membership change |
| ~20 buttons with no event listener | every action hits a route that writes to Postgres |
| No spreadsheet library loaded at all | nine formatted `.xlsx` reports |
| Faculty "Review Sessions" rendering the dashboard | a real screen |
| Faculty able to delete the coordinator's orientations | authorship checked server-side |
| 7-day reminders only | both the 15-day and 7-day windows |
| Extracted PDF text lost on re-render | persisted with the import |
