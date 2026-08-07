# Campus Here

**Project Tracking & Allocation System** — Department of Computer Science and
Engineering, BMS Institute of Technology and Management.

A role-based platform for academic project cycles: group formation, title
originality checking, guide allocation, review scheduling and reporting for
Admin, Student and Faculty users.

> **Status:** under construction. Phases A (scaffold) and B (data model) are
> complete. See `docs/` for the full plan as it lands.

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

## Licence

Academic project work. Not licensed for redistribution.
