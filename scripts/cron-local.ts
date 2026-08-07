/**
 * Local reminder dispatcher.
 *
 * Production runs on Vercel Cron (see `vercel.json`), because an in-process
 * `node-cron` schedule cannot survive on serverless — functions only exist for
 * the duration of a request. This script gives local development the same
 * behaviour by calling the identical API route on a schedule, so there is one
 * dispatch implementation rather than two.
 *
 *   npm run cron
 */
import "dotenv/config";
import cron from "node-cron";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET ?? "";
const TIMEZONE = process.env.APP_TIMEZONE ?? "Asia/Kolkata";
const SCHEDULE = "0 9 * * *"; // 09:00 local, matching the 03:30 UTC Vercel cron

async function dispatch() {
  const startedAt = new Date().toISOString();
  try {
    const res = await fetch(`${APP_URL}/api/cron/reminders`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    const body = await res.text();
    console.log(`[cron ${startedAt}] ${res.status} ${body}`);
  } catch (error) {
    console.error(`[cron ${startedAt}] dispatch failed:`, error);
  }
}

if (!CRON_SECRET) {
  console.error("CRON_SECRET is not set. Copy .env.example to .env first.");
  process.exit(1);
}

console.log(
  `Reminder cron armed for "${SCHEDULE}" (${TIMEZONE}), target ${APP_URL}.\n` +
    `Pass --now to dispatch immediately as well.`,
);

cron.schedule(SCHEDULE, dispatch, { timezone: TIMEZONE });

if (process.argv.includes("--now")) void dispatch();
