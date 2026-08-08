/**
 * Feature-test runner.
 *
 * These suites drive the real HTTP API against a real PostgreSQL database —
 * they sit between the unit tests (pure logic, no database) and the browser
 * self-test (real clicks, real rendering).
 *
 * Each suite mutates data on purpose: 01 forms groups, 03 squeezes guide
 * capacity, 05 marks attendance. The runner therefore re-seeds before every
 * suite so each one starts from the same known cohort and the order they run
 * in cannot change the result.
 *
 *   npm run test:feature              # all suites
 *   npm run test:feature -- 03        # only suites whose name contains "03"
 */
import "dotenv/config";
import { spawn } from "node:child_process";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const BASE = process.env.APP_URL ?? "http://localhost:3000";
const filter = process.argv.slice(2).find((arg) => !arg.startsWith("-"));

function run(command: string, args: string[], quiet = false): Promise<{ code: number; out: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      shell: process.platform === "win32",
      env: process.env,
    });
    let out = "";
    const capture = (chunk: Buffer) => {
      const text = chunk.toString();
      out += text;
      if (!quiet) process.stdout.write(text);
    };
    child.stdout.on("data", capture);
    child.stderr.on("data", capture);
    child.on("close", (code) => resolve({ code: code ?? 1, out }));
  });
}

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  return false;
}

async function main() {
  console.log(`Feature tests against ${BASE}\n`);

  if (!(await waitForServer())) {
    console.error(
      `No server answering at ${BASE}. Start one with \`npm run dev\` first.`,
    );
    process.exit(1);
  }

  const suites = readdirSync(HERE)
    .filter((name) => name.endsWith(".mjs"))
    .filter((name) => !filter || name.includes(filter))
    .sort();

  if (suites.length === 0) {
    console.error(filter ? `No suite matches "${filter}".` : "No suites found.");
    process.exit(1);
  }

  const results: Array<{ suite: string; ok: boolean; passed: number; failed: number }> = [];

  for (const suite of suites) {
    console.log(`\n${"─".repeat(70)}\n▶ ${suite}\n${"─".repeat(70)}`);

    // Every suite starts from the same cohort.
    const seeded = await run("npx", ["prisma", "db", "seed"], true);
    if (seeded.code !== 0) {
      console.error("  seed failed:\n" + seeded.out.split("\n").slice(-10).join("\n"));
      results.push({ suite, ok: false, passed: 0, failed: 1 });
      continue;
    }

    const { code, out } = await run("node", [join(HERE, suite)]);
    const tally = out.match(/(\d+) passed, (\d+) failed/);
    results.push({
      suite,
      ok: code === 0,
      passed: tally ? Number(tally[1]) : 0,
      failed: tally ? Number(tally[2]) : code === 0 ? 0 : 1,
    });
  }

  // Leave the database in the clean demo state whatever happened.
  await run("npx", ["prisma", "db", "seed"], true);

  console.log(`\n${"═".repeat(70)}\nFEATURE TEST SUMMARY\n${"═".repeat(70)}`);
  let totalPassed = 0;
  let totalFailed = 0;
  for (const result of results) {
    totalPassed += result.passed;
    totalFailed += result.failed;
    console.log(
      `  ${result.ok ? "PASS" : "FAIL"}  ${result.suite.padEnd(32)} ${result.passed} passed, ${result.failed} failed`,
    );
  }
  console.log(
    `\n  ${results.length} suites · ${totalPassed} checks passed · ${totalFailed} failed\n`,
  );

  process.exit(totalFailed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("runner crashed:", error);
  process.exit(1);
});
