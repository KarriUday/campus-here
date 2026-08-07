# Campus Here

**Project Tracking & Allocation System** — Department of Computer Science and
Engineering, BMS Institute of Technology and Management.

A role-based platform for academic project cycles: group formation, title
originality checking, guide allocation, review scheduling and reporting for
Admin, Student and Faculty users.

> **Status:** under construction. Scaffold, data model, authentication, seed
> data and the application shell are complete; the feature modules land in
> later phases and their routes currently say so explicitly rather than
> showing sample data.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Animation / icons | Framer Motion · Lucide |
| Database | PostgreSQL 17 |
| ORM | Prisma 7 with the `@prisma/adapter-pg` driver adapter |
| Auth | JWT (`jose`, HS256) in HTTP-only cookies, bcrypt hashing |
| Email / WhatsApp | Nodemailer · Twilio |
| Reports | SheetJS (`.xlsx`) |
| Tests | Vitest |
| Hosting | Vercel (app + cron) |

Next.js was chosen over a split Vite + Express deployment so that API routes sit
next to the UI: one Vercel deployment, no CORS layer, edge middleware for role
gating, and Vercel Cron able to invoke a route directly — which an in-process
`node-cron` server cannot do on serverless.

---

## Getting started

**Prerequisites:** Node.js 20+ and either Docker Desktop or a Postgres
connection string.

```bash
npm install                 # also runs `prisma generate`
cp .env.example .env        # then fill in the values

docker compose up -d        # Postgres 17 on localhost:5433
npx prisma migrate dev      # create the schema
npm run db:check            # verify the app can actually connect
npx prisma db seed          # demo data (Phase D)

npm run dev                 # http://localhost:3000
```

Using managed Postgres instead of Docker? Set `DATABASE_URL` to the pooled
connection string and `DIRECT_URL` to the direct one — Prisma Migrate runs DDL,
which pooled endpoints reject. Nothing else changes; the same driver adapter
serves both.

### Demo accounts

`npx prisma db seed` creates 3 cycles, 40 guides, 300 students and 71 groups.
Every seeded account shares the password in `SEED_PASSWORD` (default
`Campus@123`). Change it before any real deployment.

| Role | Email |
|---|---|
| Admin | `admin@example.edu` |
| Faculty | `ananya.rao@example.edu` (any guide in `prisma/seed-data/people.ts`) |
| Student | `1BY23CS001`–`1BY23CS300`, addresses printed by the seed |

Addresses are `@example.edu` because this repository is public. The Mail
Center's live test recipient is read from the uncommitted `DEMO_STUDENT_EMAIL`
instead of being baked into the seed.

The seed is deterministic — it runs off a fixed PRNG seed, so the same cohort
comes back every time. It **truncates every table** before inserting, and
refuses to run when `NODE_ENV=production` unless `SEED_ALLOW_PRODUCTION=true`.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | `prisma generate` then a production build |
| `npm run verify` | typecheck → lint → test → build |
| `npm run test` | Vitest unit tests |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:deploy` | Apply migrations (production) |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Prisma Studio |
| `npm run db:check` | Connectivity smoke check through the real client |
| `npm run cron` | Local reminder dispatcher (production uses Vercel Cron) |

---

## Data model

26 models. Beyond the entities named in the specification, the following exist
because the screens require them: `ReviewSession` (attendance and evaluation
attach to a session, not a group), `AllocationRun` (allocation run history),
`Domain` and `CapacityRule` (Settings master data), `Notification` (per-recipient
inbox and delivery state), `ImportBatch` (the "latest import" panel),
`GroupMember`, `StudentCycle` and `UploadedFile`.

Three normalisation decisions worth calling out:

- **A student is a person, not a per-cycle row.** One human keeps one login even
  when they appear in the Major, Mini and Internship cycles; roster membership
  lives in `StudentCycle`.
- **One active group per cycle is a database invariant.** `GroupMember` carries a
  denormalised `cycleId` so `@@unique([cycleId, studentId])` enforces it, rather
  than trusting application code.
- **No duplicate guide across the six preference ranks** is likewise enforced by
  `@@unique([groupId, facultyId])` on `GuidePreference`, not only by disabling
  the option in the UI.

Uploaded bytes (calendar PDFs, orientation audio, CSVs) are stored in Postgres
rather than on disk, because Vercel provides no writable filesystem outside
`/tmp`.

---

## Authentication

Sessions are HS256 JWTs issued by `jose`, carried in an HTTP-only, `SameSite=Lax`
cookie (`ch_session`) that expires after 8 hours. Passwords are bcrypt hashes at
cost 12.

Two layers guard every route, and the second is the one that matters:

1. `src/proxy.ts` — Next.js 16 renamed the `middleware` convention to `proxy`.
   It redirects anonymous users to `/login?next=…` and sends a signed-in user
   who wanders into another role's section back to their own dashboard.
2. `src/lib/rbac.ts` — `requireApi()` and `requirePage()` re-check the session
   inside each handler and page. A route stays protected even if a proxy
   matcher changes, and API calls get a real 401/403 rather than a redirect.

Login answers identically for an unknown address, a wrong password and a
disabled account, and spends comparable time on each, so it cannot be used to
enumerate accounts. Password-reset tokens are stored only as SHA-256 hashes,
expire in 30 minutes and are single use; the request endpoint always returns the
same response whether or not the address exists.

---

## Licence

Academic project work. Not licensed for redistribution.
