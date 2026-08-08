# API reference

44 route files. Every handler calls `requireApi(roles)` from `src/lib/rbac.ts`
before doing anything else, so the role column below is enforced in the handler
itself, not only by `src/proxy.ts`.

**Conventions**

- Auth is a `ch_session` HTTP-only cookie. No session → `401`; wrong role →
  `403`.
- The cycle a call operates on is resolved by `resolveCycle()`: `?cycleId=` or
  `?cycle=` (code) → the `ch_cycle` cookie → the active cycle.
- Validation failures return `400` with `{ "error": "…" }`.
- **Scope is never taken from the request.** A faculty caller is always scoped
  to their own groups regardless of what they ask for.

---

## Authentication — `/api/auth`

| Method | Path | Roles | Notes |
|---|---|---|---|
| POST | `/login` | public | `{email, password}` → sets cookie, returns `{user, redirectTo}`. Answers identically for unknown address, wrong password and disabled account, and spends a comparable bcrypt comparison on a miss so timing does not leak. |
| POST | `/logout` | any | Clears the cookie. |
| GET | `/me` | any | Reads through to the database, so a deactivated account stops working before its token expires. |
| POST | `/forgot-password` | public | Always `200` with the same body. Stores a SHA-256 hash of a 30-minute single-use token. |
| POST | `/reset-password` | public | `{token, password}`; password minimum 8 characters. |

## Students — `/api/students`

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/students` | ADMIN, FACULTY | `?q=` searches USN/name/email, `?grouped=yes\|no`, `?page=`. 50 per page. |
| DELETE | `/students` | ADMIN | Clears the cycle's roster and its groups. People and logins survive — they may be in another cycle. |
| POST | `/students/upload` | ADMIN | Multipart `file` or JSON `text`, plus `apply`. `apply=false` validates and returns a preview; `apply=true` re-parses and writes. |
| GET | `/students/available` | STUDENT | The unattached pool for invite search, excluding the caller by session identity. |

## Faculty — `/api/faculty`

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/faculty` | ADMIN, FACULTY, STUDENT | Includes per-cycle `assigned` and `available` counts. Students need it to rank preferences. |
| PATCH | `/faculty` | ADMIN | `{id, capacity?, isActive?, domainIds?}`. |
| POST | `/faculty/upload` | ADMIN | Same two-step contract as the student upload. |

## Groups and invites

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/groups` | STUDENT | The caller's group for the cycle, or `null`. |
| POST | `/groups` | STUDENT | Creates a `FORMING` group with the caller as leader. |
| POST | `/groups/[id]/invite` | STUDENT | `{identifier}` — USN or email. Refused once members + pending invites fill the group. |
| POST | `/groups/[id]/leave` | STUDENT | Reassigns leadership, or disbands if last out. |
| PUT | `/groups/[id]/preferences` | STUDENT | `{facultyIds}` — exactly `prefCount`, all distinct. |
| POST | `/groups/[id]/submit` | STUDENT | Leader only. Requires all five checks; sets `lockedAt`. |
| GET | `/invites` | STUDENT | Invites addressed to the caller. |
| POST | `/invites/[id]/accept` | STUDENT | Serializable. Auto-declines the caller's other pending invites. |
| POST | `/invites/[id]/reject` | STUDENT | — |

## Titles and originality

| Method | Path | Roles | Notes |
|---|---|---|---|
| POST | `/titles/check` | ADMIN, FACULTY, STUDENT | `{title, excludeTitleId?}` → full report with top 5 and per-signal breakdown. Advisory; writes nothing. |
| GET | `/titles` | ADMIN, FACULTY, STUDENT | `?source=corpus\|submitted`, `?q=`. |
| POST | `/titles` | ADMIN, STUDENT | Registers a group's title. **Re-runs the check server-side and returns `409` at ≥0.95**, so the client score never authorises the write. |
| POST | `/titles/import` | ADMIN | Corpus import: one per line, or CSV with the documented headers and aliases. |
| POST | `/titles/[id]/review` | ADMIN, FACULTY | `{decision, reason?}`. A guide may only review their own groups; rejection requires a reason. |

## Allocation

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/allocation` | ADMIN | Current state plus a count awaiting a first run. |
| POST | `/allocation/run` | ADMIN | `{dryRun}`. Preview writes nothing; commit runs serializable and refuses an unstable matching. |
| POST | `/allocation/manual` | ADMIN | `{groupId, facultyId}`. Locked against later runs; refused if the guide is at capacity. |
| GET | `/allocation/runs` | ADMIN | History with the tie-break parameters each run used. |

## Calendar, reminders, reviews

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/calendar` | ADMIN | Latest import, its persisted text, and detected events. |
| POST | `/calendar` | ADMIN | Multipart PDF (≤10MB) or pasted text. Pasted text wins — it is the fallback for scanned PDFs. |
| DELETE | `/calendar/events/[id]` | ADMIN | Cascades the event's reminders. |
| GET | `/reminders` | ADMIN, FACULTY, STUDENT | Status recomputed against the clock on read. |
| POST | `/reminders` | ADMIN | Regenerates both windows. Never resurrects one already sent. |
| GET | `/reviews` | ADMIN, FACULTY | Faculty see only their own sessions. |
| POST | `/reviews` | ADMIN | Schedules a session. `409` with `conflicts` on a guide or venue clash; `force: true` overrides. |
| GET | `/cron/reminders` | machine | `Authorization: Bearer $CRON_SECRET`, compared in constant time. |

## Attendance, evaluation, orientation

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/attendance?sessionId=` | ADMIN, FACULTY | Roster with any existing marks. Guides get `403` on another guide's session. |
| POST | `/attendance` | ADMIN, FACULTY | Upserts marks and flips the session to `COMPLETED`. Rejects a student not in the group. |
| GET | `/evaluation` | ADMIN, FACULTY | Faculty scoped to their own. |
| POST | `/evaluation` | ADMIN, FACULTY | `{sessionId, score, remarks?}`; score 0–10. |
| GET | `/orientation` | all | Each row carries `canDelete`, computed from authorship. |
| POST | `/orientation` | ADMIN, FACULTY | JSON for text, multipart for audio (≤8MB). |
| DELETE | `/orientation?id=` | ADMIN, FACULTY | A guide may delete only their own posts. |
| GET | `/orientation/[id]/audio` | any signed-in | Streams the stored recording. |

## Communications

| Method | Path | Roles | Notes |
|---|---|---|---|
| POST | `/mail/send` | ADMIN, FACULTY | Multipart or JSON. Everyone BCC'd; attachments ≤20MB total. A guide asking for `mode=ALL` is narrowed to their own groups. |
| GET | `/mail/history` | ADMIN, FACULTY | Faculty see only what they sent. |
| GET | `/mail/config` | ADMIN, FACULTY | Transport state. Never returns a secret. |
| POST | `/mail/config` | ADMIN, FACULTY | Stores SMTP credentials AES-256-GCM encrypted. |
| PUT | `/mail/config` | ADMIN, FACULTY | Verifies stored credentials without sending. |
| DELETE | `/mail/config` | ADMIN, FACULTY | Removes them. |
| POST | `/whatsapp` | ADMIN, FACULTY | Twilio. Rejects invalid numbers rather than dropping them. Appends the documents note when `documentsEmailed`. |
| GET | `/whatsapp` | ADMIN, FACULTY | History plus dry-run/configured state. |
| GET | `/notifications` | STUDENT, ADMIN | `?since=` — the polling half of delivery. |
| PATCH | `/notifications` | STUDENT | Marks as read. |
| GET | `/notifications/stream` | STUDENT | SSE. Self-caps at 50s and asks the client to reconnect. |

## Reports and misc

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/reports/export` | ADMIN, FACULTY | `?type=` one of nine. Faculty are limited to five group-level reports; the other four return `403`. |
| GET | `/samples?kind=` | ADMIN | Correctly shaped example CSVs. |
| GET | `/settings` | ADMIN | Domains, capacity rules, cycles. |
| POST | `/settings` | ADMIN | Creates a domain. |
| PATCH | `/settings` | ADMIN | Updates a domain or a capacity rule, optionally applying it to existing guides. |
| GET | `/health` | public | Database reachability and mail mode. `503` when the database is down. |
