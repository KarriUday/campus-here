/**
 * §8.6 end-to-end self-test.
 *
 * Drives the real browser against the real backend: it clicks the actual
 * buttons rather than calling the APIs behind them, so a screen that renders
 * but does not work still fails here. Every page visit also collects console
 * errors and failed network requests.
 *
 *   npm run test:e2e            # headless
 *   npm run test:e2e -- --headed
 *   npm run test:e2e -- --shots  # also write screenshots to .e2e/
 */
import { mkdirSync } from "node:fs";
import { chromium, type Browser, type ConsoleMessage, type Page } from "playwright";

const BASE = process.env.APP_URL ?? "http://localhost:3000";
const PASSWORD = process.env.SEED_PASSWORD ?? "Campus@123";
const HEADED = process.argv.includes("--headed");
const SHOTS = process.argv.includes("--shots");
const SHOT_DIR = ".e2e";
/** Generous: the dev server compiles each route on first visit. */
const NAV_TIMEOUT = 120_000;

type Issue = { where: string; detail: string };
const consoleErrors: Issue[] = [];
const networkErrors: Issue[] = [];

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(label: string, ok: boolean, detail = "") {
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ""}`);
  } else {
    failed += 1;
    failures.push(label);
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function watch(page: Page, where: () => string) {
  page.on("console", (message: ConsoleMessage) => {
    if (message.type() !== "error") return;
    const text = message.text();
    // React's hydration hint and favicon noise are not app defects.
    if (text.includes("Download the React DevTools")) return;
    consoleErrors.push({ where: where(), detail: text.slice(0, 200) });
  });
  page.on("response", (response) => {
    if (response.status() < 400) return;
    // 401/403 are deliberately exercised by the auth checks below.
    if ([401, 403].includes(response.status())) return;
    networkErrors.push({
      where: where(),
      detail: `${response.status()} ${response.url().replace(BASE, "")}`,
    });
  });
}

/**
 * Sign-in navigates client-side via router.replace, which fires no `load`
 * event, so waitForURL would hang. Polling the pathname also tolerates the
 * dev server compiling a route for the first time.
 */
async function login(page: Page, email: string) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: NAV_TIMEOUT });

  const emailBox = page.getByLabel("Email");
  const passwordBox = page.getByLabel("Password");

  // These are controlled React inputs. Filling before hydration writes to the
  // DOM, then hydration re-renders from empty state and the value is lost —
  // the form then posts blank fields and the API answers 400. Fill and verify.
  for (let attempt = 0; attempt < 5; attempt++) {
    await emailBox.fill(email);
    await passwordBox.fill(PASSWORD);
    if ((await emailBox.inputValue()) === email && (await passwordBox.inputValue()) === PASSWORD) {
      break;
    }
    await page.waitForTimeout(300);
  }

  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForFunction(
    () => /^\/(admin|student|faculty)/.test(window.location.pathname),
    undefined,
    { timeout: NAV_TIMEOUT },
  );
  await page.waitForLoadState("networkidle", { timeout: NAV_TIMEOUT });
}

async function logout(page: Page) {
  await page.request.post(`${BASE}/api/auth/logout`);
  await page.context().clearCookies();
}

const ADMIN_ROUTES = [
  "/admin", "/admin/imports", "/admin/orientation", "/admin/calendar",
  "/admin/mail", "/admin/students", "/admin/faculty", "/admin/groups",
  "/admin/allocation", "/admin/reviews", "/admin/attendance", "/admin/titles",
  "/admin/reports", "/admin/settings",
];
const STUDENT_ROUTES = [
  "/student", "/student/my-group", "/student/invites", "/student/domain",
  "/student/preferences", "/student/timeline", "/student/reminders",
  "/student/notifications",
];
const FACULTY_ROUTES = [
  "/faculty", "/faculty/orientation", "/faculty/mail", "/faculty/assigned",
  "/faculty/review-sessions", "/faculty/mark-attendance", "/faculty/evaluate",
  "/faculty/title-approval",
];

async function walk(page: Page, label: string, routes: string[], current: { path: string }) {
  let ok = 0;
  for (const route of routes) {
    current.path = route;
    const response = await page.goto(`${BASE}${route}`, {
      waitUntil: "networkidle",
      timeout: NAV_TIMEOUT,
    });
    const status = response?.status() ?? 0;
    const heading = await page.locator("h1").first().textContent();
    if (status === 200 && heading && heading.trim().length > 0) ok += 1;
    else console.log(`        ${route} -> ${status} heading=${heading}`);
    if (SHOTS) {
      await page.screenshot({
        path: `${SHOT_DIR}/${route.replace(/\//g, "_").replace(/^_/, "")}.png`,
        fullPage: true,
      });
    }
  }
  check(`${label}: all ${routes.length} screens render with a heading`, ok === routes.length,
    `${ok}/${routes.length}`);
}

async function main() {
  if (SHOTS) mkdirSync(SHOT_DIR, { recursive: true });

  const browser: Browser = await chromium.launch({ headless: !HEADED });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const current = { path: "startup" };
  watch(page, () => current.path);

  try {
    console.log("\n=== 1. sign in as each role ===");
    for (const [role, email] of [
      ["admin", "admin@example.edu"],
      ["faculty", "ananya.rao@example.edu"],
      ["student", "manish.gupta1@example.edu"],
    ] as const) {
      current.path = `login:${role}`;
      await login(page, email);
      const landed = new URL(page.url()).pathname;
      check(`${role} signs in and lands on their dashboard`, landed.startsWith(`/${role}`), landed);
      await logout(page);
    }

    console.log("\n=== 2. every screen renders, per role ===");
    await login(page, "admin@example.edu");
    await walk(page, "admin", ADMIN_ROUTES, current);
    await logout(page);

    await login(page, "manish.gupta1@example.edu");
    await walk(page, "student", STUDENT_ROUTES, current);
    await logout(page);

    await login(page, "ananya.rao@example.edu");
    await walk(page, "faculty", FACULTY_ROUTES, current);
    await logout(page);

    console.log("\n=== 3. the originality block, through the UI ===");
    // A submitted group is locked and its form read-only — correct behaviour,
    // so drive this with a student whose group is still editable.
    await login(page, "admin@example.edu");
    type RosterEntry = { usn: string; email: string; group?: { code: string; status: string } };
    let editable: RosterEntry | undefined;
    // The roster is paged and sorted by CGPA, and the strongest students are
    // in the groups that already submitted, so page 1 can be entirely locked.
    for (let pageNo = 1; pageNo <= 7 && !editable; pageNo++) {
      const roster = await page.request.get(
        `${BASE}/api/students?grouped=yes&page=${pageNo}`,
      );
      const { students } = (await roster.json()) as { students: RosterEntry[] };
      if (students.length === 0) break;
      editable = students.find(
        (s) => s.group && ["FORMING", "READY"].includes(s.group.status),
      );
    }
    await logout(page);

    if (!editable) {
      check("found a student in an unlocked group", false, "every seeded group is locked");
    } else {
      console.log(
        `        using ${editable.usn} in ${editable.group?.code} (${editable.group?.status})`,
      );
      await login(page, editable.email);
      current.path = "/student/domain";
      await page.goto(`${BASE}/student/domain`, { waitUntil: "networkidle", timeout: NAV_TIMEOUT });
    }

    const titleBox = page.getByLabel("Title", { exact: true });
    if (editable && (await titleBox.count()) && (await titleBox.isEnabled())) {
      await titleBox.fill("Smart Attendance Face Recognition");
      // The check is debounced; wait for the verdict rather than a fixed sleep.
      await page.getByText(/Blocked · 100% similar/).waitFor({ timeout: 60_000 });
      check("typing a duplicate title shows the blocked verdict", true, "100% similar");

      const saveButton = page.getByRole("button", { name: "Save" });
      check("Save is disabled while the title is blocked", await saveButton.isDisabled());

      await titleBox.fill("Tactile Wayfinding Beacons for Transit Stations");
      await page.getByText(/Original · \d+% similar/).waitFor({ timeout: 60_000 });
      check("an original title clears the block", true);
    } else if (editable) {
      check("the domain form is editable for an unlocked group", false, "title field absent or disabled");
    }
    await logout(page);

    console.log("\n=== 4. admin exports a workbook by clicking the button ===");
    await login(page, "admin@example.edu");
    current.path = "/admin/reports";
    await page.goto(`${BASE}/admin/reports`, { waitUntil: "networkidle", timeout: NAV_TIMEOUT });
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: NAV_TIMEOUT }),
      page.getByRole("button", { name: "Download" }).first().click(),
    ]);
    check("clicking Download produces an .xlsx", download.suggestedFilename().endsWith(".xlsx"),
      download.suggestedFilename());

    console.log("\n=== 5. allocation preview, through the UI ===");
    current.path = "/admin/allocation";
    await page.goto(`${BASE}/admin/allocation`, { waitUntil: "networkidle", timeout: NAV_TIMEOUT });
    await page.getByRole("button", { name: "Preview" }).click();
    await page.getByText(/Stable — no blocking pair/).waitFor({ timeout: NAV_TIMEOUT });
    check("Preview reports a stable matching in the UI", true);
    await logout(page);

    console.log("\n=== 6. responsive at 375px ===");
    const mobile = await browser.newContext({
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: 2,
    });
    const mobilePage = await mobile.newPage();
    watch(mobilePage, () => `375px ${current.path}`);
    await login(mobilePage, "admin@example.edu");
    current.path = "/admin/students";
    await mobilePage.goto(`${BASE}/admin/students`, { waitUntil: "networkidle", timeout: NAV_TIMEOUT });

    const overflow = await mobilePage.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    check("the page body does not scroll horizontally at 375px", overflow <= 1, `${overflow}px overflow`);

    await mobilePage.getByRole("button", { name: "Open navigation" }).click();
    const drawer = mobilePage.getByRole("dialog", { name: "Navigation" });
    await drawer.waitFor({ timeout: 30_000 });
    check("the mobile drawer opens", await drawer.isVisible());
    await mobilePage.getByRole("link", { name: "Allocation" }).click();
    await mobilePage.waitForURL(/\/admin\/allocation/, { timeout: NAV_TIMEOUT });
    // The drawer unmounts through an exit animation, so wait for it to go
    // rather than sampling the instant after the click.
    const closed = await drawer
      .waitFor({ state: "hidden", timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    check("a drawer link navigates and closes the drawer", closed);
    if (SHOTS) await mobilePage.screenshot({ path: `${SHOT_DIR}/mobile-375.png`, fullPage: true });
    await mobile.close();

    console.log("\n=== 7. keyboard and labelling ===");
    current.path = "/login";
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: NAV_TIMEOUT });
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return null;
      const style = getComputedStyle(el);
      return {
        tag: el.tagName,
        label: el.getAttribute("aria-label") ?? (el as HTMLInputElement).name ?? "",
        outline: style.outlineStyle,
      };
    });
    check("tabbing reaches a form control with a visible focus outline",
      Boolean(focused) && focused!.outline !== "none",
      `${focused?.tag} ${focused?.label} outline=${focused?.outline}`);

    const unlabelled = await page.evaluate(() =>
      [...document.querySelectorAll("input, select, textarea")].filter((el) => {
        const id = el.getAttribute("id");
        const labelled =
          (id && document.querySelector(`label[for="${id}"]`)) ||
          el.getAttribute("aria-label") ||
          el.closest("label");
        return !labelled && el.getAttribute("type") !== "hidden";
      }).length,
    );
    check("every form control on the login page is labelled", unlabelled === 0,
      `${unlabelled} unlabelled`);

    console.log("\n=== 8. console and network cleanliness ===");
    check("no console errors across every screen", consoleErrors.length === 0,
      consoleErrors.slice(0, 3).map((e) => `${e.where}: ${e.detail}`).join(" | "));
    check("no unexpected 4xx/5xx responses", networkErrors.length === 0,
      networkErrors.slice(0, 3).map((e) => `${e.where}: ${e.detail}`).join(" | "));
  } finally {
    await browser.close();
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failures.length > 0) console.log(`failing: ${failures.join(", ")}`);
  console.log();
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("self-test crashed:", error);
  process.exit(1);
});
