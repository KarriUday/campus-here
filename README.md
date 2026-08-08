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

## Group formation

The rules the prototype only implied are enforced in `src/server/services/groups.ts`
and, wherever possible, by the database as well:

| Rule | Enforced by |
|---|---|
| One active group per student per cycle | `@@unique([cycleId, studentId])` on `GroupMember` |
| No duplicate guide across the six ranks | `@@unique([groupId, facultyId])` on `GuidePreference` |
| A group never exceeds its size | members + outstanding invites ≤ `groupSize`, checked in a serializable transaction |
| Average CGPA | recomputed arithmetically on every membership change |
| Accepting an invite declines the rest | one `updateMany` inside the accept transaction |

Accepting and creating run at `Serializable` isolation with a retry on Prisma's
`P2034`, because two students can act on the last seat in the same instant. The
unique constraint is the real backstop; the isolation level is what turns a
race into a clean error rather than a fifth member.

A group must clear five checks before its leader can submit: exactly
`groupSize` members, a chosen domain, a registered title, a non-empty problem
statement, and `prefCount` ranked guides. Submitting sets `lockedAt`, after
which membership, title, statement and preferences are all immutable — which
is what makes an allocation run reproducible.

---

## Guide allocation

`src/lib/allocation-engine.ts` is pure — no database import — so it unit-tests
without a connection and the dry-run preview provably executes the same code as
the committed run.

Groups propose down their six ranked preferences; each guide holds the best
proposals up to capacity and releases the rest. **A guide ranks competing
proposals by:**

1. domain match
2. higher group average CGPA
3. earlier preference submission
4. group code ascending

The fourth is a deterministic final tiebreak, so identical input always yields
an identical matching — §11 asks for this choice to be explicit rather than
accidental.

Manual assignments are never recomputed: they consume capacity before matching
begins and their groups leave the market. `findBlockingPair()` verifies
stability, and a run that fails its own check is refused rather than written.
Committing happens inside a serializable transaction.

## Communications

Email and WhatsApp are **dry-run by default**. A dry run is recorded exactly
like a live one — an `EmailMessage` row, a `Notification` row per recipient,
delivery counts — but with `mode=DRY_RUN` throughout, and it is never reported
as delivered. Set `MAIL_DRY_RUN=false` / `WHATSAPP_DRY_RUN=false` with real
credentials to go live.

Recipients are always resolved server-side from the caller's identity: a guide
addressing "their students" gets the members of the groups they actually guide,
and asking for the whole cycle is silently narrowed rather than honoured.
Everyone is BCC'd, so students never see each other's addresses. Attachments
are capped at 20MB in total.

Per-faculty SMTP credentials are encrypted at rest with AES-256-GCM
(`src/server/services/crypto.ts`) and never returned by any endpoint once
saved. GCM is authenticated, so a tampered ciphertext fails loudly instead of
decrypting to garbage.

The student inbox uses two tiers, the same arrangement as the prototype:
server-sent events for speed, and `GET /api/notifications?since=` polling as
the guarantee. On serverless the SSE function is killed at its execution limit,
so the stream is expected to end and reconnect — polling is what ensures no
message is missed.

---

## Originality filter

`src/server/services/similarity.ts`. Every score is computed server-side; the
live score shown while a student types is advisory, and `POST /api/titles`
re-runs the whole check before writing, so a client that ignores a block still
cannot register a duplicate.

**Pipeline.** Lowercase and strip punctuation → expand multi-word synonyms →
expand abbreviations (`ML` → machine learning, `IoT` → internet of things,
`Face ID` → face recognition) → drop stopwords and academic filler (`system`,
`application`, `smart`, `automated`, `using`, `based`, …) → strip plurals.

**Score.** TF-IDF cosine against the corpus is the primary signal at **0.65**,
with the highest of four lexical signals — Dice token overlap, containment,
character 3-gram Jaccard, Levenshtein ratio — contributing the remaining
**0.35**. Cosine alone under-reads a near-duplicate whose shared words are
common across the corpus; edit distance alone over-reads two unrelated titles
of similar shape. When two titles reduce to the *same set of tokens* the score
is forced to **1.00** regardless of the weighted sum — same words in any order
is the same project.

**Bands** (spec §3.4): **≥ 0.95 blocked**, **0.80–0.94 warning**, **< 0.80
allowed**. The API returns the top five matches, each with its five individual
signal values and the exact overlapping words, so the UI can explain *why*
something was flagged rather than just showing a number.

The project report's worked example is a unit test: *"Smart Attendance via Face
Recognition"* and *"Smart Attendance Face Recognition"* both reduce to
`attendance face recognition`, score 1.00, and are blocked.

Two deliberate calibration choices are worth knowing. The stopword list is
conservative — `design`, `model`, `study`, `platform` and `tool` are **not**
stripped, because dropping them would collide genuinely different projects
(*VLSI Design*, *Language Model*). And synonym phrases are matched on word
boundaries, not as substrings: `"machine learning"` contains `"e learning"`,
and a naive replace rewrote it to `"machinonline learning"`.

---

## Data imports

CSV only, parsed and validated entirely on the server. Uploading is two steps —
the same file is posted once to validate and again to apply, and it is
re-parsed both times, so nothing the browser sends back is trusted.

| Import | Required columns | Optional |
|---|---|---|
| Students | `usn`, `name` (or `full_name`), `cgpa`, `email` | `phone` |
| Faculty | `name` (or `full_name`), `email`, `designation` | `domains` (`;`-separated), `capacity`, `phone`, `employee_id` |
| Titles | one per line, **or** `title` | `group`, `domain`, `guide`, `cycle` |

Title imports also accept the aliases the specification lists: `project title`,
`final title`, `group code`, `faculty`, `mentor`.

One error is reported per row — the first rule that fails — which keeps the
rejection table readable when a spreadsheet is badly formatted. A student who
already exists is **enrolled** into the cycle rather than rejected as a
duplicate, since one person keeps one login across Major, Mini and Internship
cycles. Accounts created by an import get the password in
`DEFAULT_IMPORT_PASSWORD`; students are expected to reset it.

---

## Licence

Academic project work. Not licensed for redistribution.
