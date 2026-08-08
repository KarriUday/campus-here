# Deployment

Target: Vercel for the application and cron, with managed PostgreSQL. The
application is one deployable — API routes ship with the UI.

## 1. Provision a database

Neon, Supabase or Vercel Postgres all work unchanged; the app talks to each
through the same `@prisma/adapter-pg` driver adapter.

Two connection strings are needed and they are **not** interchangeable:

| Variable | Used by | Must be |
|---|---|---|
| `DATABASE_URL` | the running app | the **pooled** endpoint |
| `DIRECT_URL` | `prisma migrate` | the **direct** endpoint |

Migrations run DDL, which pooled endpoints reject. On Neon the direct host is
the one *without* `-pooler`.

## 2. Environment variables

Set every variable in `.env.example` in the Vercel project. Generate the
secrets rather than inventing them:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"  # JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"  # ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"  # CRON_SECRET
```

- `APP_URL` — the deployed origin. Password-reset links are built from it.
- `APP_TIMEZONE` — `Asia/Kolkata`. Reminder dispatch is anchored to it.
- `MAIL_DRY_RUN` / `WHATSAPP_DRY_RUN` — leave `true` until real credentials are
  in place. Dry run records everything and sends nothing.
- `SEED_PASSWORD`, `DEFAULT_IMPORT_PASSWORD` — change from the defaults.

**Rotating `ENCRYPTION_KEY` invalidates stored SMTP credentials.** They are
AES-256-GCM ciphertext bound to that key; decryption fails closed and each
guide re-enters their app password. Nothing else is affected — passwords are
bcrypt hashes and reset tokens are SHA-256 hashes.

## 3. Deploy

```bash
npm i -g vercel
vercel login          # interactive, must be run by a human
vercel link
# set env vars in the dashboard or with `vercel env add`
npx prisma migrate deploy     # against DIRECT_URL
vercel --prod
```

`npm run build` runs `prisma generate` first, so the client is regenerated on
every build — the generated client is git-ignored by design.

Optionally seed a demo cycle. The seed **truncates every table** and refuses to
run under `NODE_ENV=production` unless `SEED_ALLOW_PRODUCTION=true`. Do not do
this to a database with real data.

## 4. Cron

`vercel.json` already registers it:

```json
{ "crons": [{ "path": "/api/cron/reminders", "schedule": "30 3 * * *" }] }
```

03:30 UTC is 09:00 IST. Vercel sends `Authorization: Bearer $CRON_SECRET`; the
route compares it in constant time and returns 401 otherwise, so the endpoint
is safe to leave publicly routable.

Confirm it registered under **Project → Settings → Cron Jobs** after the first
production deploy. Trigger it by hand with:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<your-app>/api/cron/reminders
```

### Why not `node-cron`

The specification anticipated this. An in-process schedule cannot survive on
serverless, where a function exists only for the duration of a request. Vercel
Cron invokes the route instead. `npm run cron` runs the identical route on a
local `node-cron` schedule, so there is one dispatch implementation, not two.

## 5. Serverless caveats

**Server-sent events.** `/api/notifications/stream` self-caps at 50 seconds and
asks the client to reconnect, because the platform will kill the function
anyway. The `?since=` polling endpoint is what guarantees delivery; the client
falls back to it automatically. This is expected behaviour, not a fault.

**Uploads.** There is no writable filesystem outside `/tmp`, and `/tmp` does not
persist. Calendar PDFs, orientation audio and import sources are stored in
Postgres, size-capped in the route handlers.

**Connection pooling.** Serverless creates many short-lived instances, which is
why the app must use the pooled endpoint. `src/lib/prisma.ts` also caches the
client on `globalThis` so development hot-reload does not exhaust connections.

## 6. Going live with email

1. Create a Gmail **app password** at <https://myaccount.google.com/apppasswords>
   — not the account password.
2. Either set `SMTP_USER` / `SMTP_PASS` for a server-wide sender, or have each
   guide store their own under Mail Center → Transport.
3. Set `MAIL_DRY_RUN=false` and redeploy.
4. Send one message and confirm it arrived, including the spam folder.

WhatsApp is the same shape: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
`TWILIO_WHATSAPP_FROM` (the sandbox sender works), then
`WHATSAPP_DRY_RUN=false`. Recipients must have joined the Twilio sandbox first.

## 7. Post-deploy checklist

```bash
curl https://<your-app>/api/health     # {"ok":true,"database":"up","mail":"…"}
```

Then, in a browser: sign in as each role, confirm the admin dashboard shows
real counts, run an allocation **preview** (it writes nothing), and download one
report.

## 8. Local development

```bash
docker compose up -d          # Postgres 17 on 5433
npx prisma migrate dev
npx prisma db seed
npm run dev
```

| Command | Purpose |
|---|---|
| `npm run verify` | typecheck → lint → unit tests → build |
| `npm run test:e2e` | browser self-test against a running dev server |
| `npm run db:check` | connectivity through the real runtime client |
| `npm run cron` | local reminder dispatcher |
