# Architecture

## Why a single Next.js app

The specification allowed either Vite + Express or Next.js. Next.js was chosen
for three concrete reasons:

1. **One deployment.** API routes sit beside the UI, so Vercel builds and ships
   a single artefact. A split `/apps/web` + `/apps/api` needs two deployments
   and a cross-origin cookie story for no benefit at this size.
2. **Route gating before render.** `src/proxy.ts` runs before a page renders, so
   an unauthenticated request never reaches a server component.
3. **Cron.** Vercel Cron invokes an HTTP route. An Express server running
   `node-cron` in-process cannot survive on serverless, where a function exists
   only for the duration of a request.

## Layers

```
  browser
     │
     ├─ src/app/(auth)/…            login, forgot-password, reset-password
     └─ src/app/(app)/…             30 role-scoped screens
            │
            │  server components read Prisma directly;
            │  client components call the API routes
            ▼
     src/proxy.ts                   redirects; runs before render
     src/app/api/**/route.ts        41 handlers, each re-checking the session
            │
            ▼
     src/lib/rbac.ts                requireApi() / requirePage()
     src/server/services/**         business logic, the only Prisma callers
     src/lib/**                     pure logic — no database import
            │
            ▼
     Prisma 7 + @prisma/adapter-pg
            │
            ▼
     PostgreSQL 17
```

## The pure/impure split

Every algorithm lives in `src/lib/` with **no database import**, and a thin
service in `src/server/services/` wires it to Prisma:

| Pure module | Service that uses it |
|---|---|
| `allocation-engine.ts` | `services/allocation.ts` |
| `calendar-parse.ts` | `services/calendar.ts` |
| `schedule-conflicts.ts` | `app/api/reviews/route.ts` |
| `reminder-status.ts` | `services/reminders.ts` |
| `phone.ts` | `services/whatsapp.ts` |
| `utils.ts` | everywhere |

This is not decoration. It means 121 unit tests run in under a second with no
database, and — for allocation specifically — the dry-run preview and the
committed run provably execute the same function.

`services/similarity.ts` is the exception: it holds its scoring logic directly
and is imported by `services/titles.ts` for corpus loading. It has no Prisma
import either, so its tests are equally database-free.

## Authorisation

Two layers, and the second is the one that matters.

`src/proxy.ts` handles redirects: anonymous users to `/login?next=…`, and a
signed-in user who wanders into another role's section back to their own
dashboard. Next.js 16 renamed this convention from `middleware` to `proxy`, and
it now runs on the Node runtime by default.

`src/lib/rbac.ts` is the enforcement point. `requireApi(roles)` runs inside
every API handler and `requirePage(roles)` inside every page, so a route stays
protected even if a proxy matcher changes, and API callers get a real 401/403
rather than a redirect.

**Scope is always derived from the session, never from the request.** A guide
asking to email the whole cycle is narrowed to their own groups; a guide
requesting `scope=admin` on an export is forced back to `faculty`.

## Request lifecycle: exporting a report

```
GET /api/reports/export?type=groups
      │
      ├─ proxy.ts            has a session cookie? → continue
      ├─ requireApi()        ADMIN or FACULTY? → session
      ├─ resolveCycle()      ?cycleId → cookie → active cycle
      ├─ scope               FACULTY ⇒ "faculty", ignoring any query value
      ├─ buildReport()       assertScopeAllowed, then one Prisma query
      │                      whose `where` carries the guide filter
      ├─ toWorkbook()        ExcelJS: bold filled frozen header, About sheet
      └─ 200 application/vnd.openxmlformats-…sheet
```

## Data storage decisions

- **Uploaded bytes live in Postgres** (`UploadedFile.bytes`). Vercel has no
  writable filesystem outside `/tmp`, and `/tmp` does not survive between
  invocations. Calendar PDFs, orientation audio and import sources all go to
  the database, size-capped in the route handlers.
- **A student is a person, not a per-cycle row.** One human keeps one login
  across Major, Mini and Internship; `StudentCycle` records enrolment.
- **Invariants are constraints, not conventions.** One active group per cycle
  and no duplicate guide in a ranking are both `@@unique` indexes.

## Real-time notifications

Two tiers, mirroring the prototype's own arrangement:

- `GET /api/notifications/stream` — server-sent events, the fast path. It caps
  itself at 50 seconds and tells the client to reconnect, because a serverless
  function is killed at its execution limit anyway.
- `GET /api/notifications?since=` — polling every 5 seconds, the guarantee.
  The client falls back to it automatically when the stream errors.

## Scheduled work

`vercel.json` registers one cron: `30 3 * * *` UTC, which is 09:00 IST, hitting
`/api/cron/reminders`. The route authenticates with a constant-time comparison
against `CRON_SECRET`, dispatches everything due, and records `attempts` and
`lastError` so a failure is visible rather than silent.

`npm run cron` runs the same route on a local `node-cron` schedule, so there is
one dispatch implementation rather than two.
