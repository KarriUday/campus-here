import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, dashboardPathFor, verifySession } from "@/lib/auth";
import type { Role } from "@/generated/prisma/enums";

/**
 * Route gating.
 *
 * Next.js 16 renamed the `middleware` convention to `proxy`, and it now runs on
 * the Node.js runtime by default. This is a routing convenience only —
 * `src/lib/rbac.ts` re-checks the session inside every API route handler and
 * page, so nothing here is the sole line of defence.
 */

/** Page prefixes and the single role allowed to see them. */
const ROLE_PREFIXES: Array<{ prefix: string; role: Role }> = [
  { prefix: "/admin", role: "ADMIN" },
  { prefix: "/student", role: "STUDENT" },
  { prefix: "/faculty", role: "FACULTY" },
];

/** Reachable without a session. */
const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
]);

/** API prefixes that authenticate themselves (or are machine-to-machine). */
const PUBLIC_API_PREFIXES = [
  "/api/auth/login",            // password login + OTP login sub-routes
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/signup",           // OTP-based student self-registration
  "/api/health",
  "/api/cron",
];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const session = await verifySession(
    request.cookies.get(SESSION_COOKIE)?.value,
  );

  if (pathname.startsWith("/api/")) {
    if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }
    // Route handlers do the real role check; this only rejects the
    // obviously-anonymous case early, and as JSON rather than a redirect.
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  // An authenticated user has no reason to see the login screen.
  if (session && (pathname === "/login" || pathname === "/")) {
    return NextResponse.redirect(
      new URL(dashboardPathFor(session.role), request.url),
    );
  }

  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  const guarded = ROLE_PREFIXES.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!guarded) return NextResponse.next();

  if (!session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  if (session.role !== guarded.role) {
    // Send them to their own dashboard rather than a dead end. The equivalent
    // API request returns a real 403 from requireApi().
    return NextResponse.redirect(
      new URL(dashboardPathFor(session.role), request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Everything except Next internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|assets/).*)",
  ],
};
