import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/enums";
import { dashboardPathFor, getSession, type SessionPayload } from "./auth";

/**
 * Authorisation is re-checked inside every route handler, not only in
 * `proxy.ts`. The proxy is a routing convenience; these helpers are the actual
 * enforcement point, so a route stays protected even if a matcher changes or a
 * request reaches it by some other path.
 */
export type ApiAuth =
  | { ok: true; session: SessionPayload }
  | { ok: false; response: NextResponse };

export function unauthorized(message = "Authentication required.") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "You do not have access to this resource.") {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Guard an API route.
 *
 *   const auth = await requireApi(["ADMIN"]);
 *   if (!auth.ok) return auth.response;
 *   // auth.session is typed and non-null from here
 */
export async function requireApi(roles?: Role[]): Promise<ApiAuth> {
  const session = await getSession();
  if (!session) return { ok: false, response: unauthorized() };
  if (roles && roles.length > 0 && !roles.includes(session.role)) {
    if (session.role === "ADMIN" && session.facultyId && roles.includes("FACULTY")) {
      return { ok: true, session };
    }
    return { ok: false, response: forbidden() };
  }
  return { ok: true, session };
}

/**
 * Guard an API route that reads or writes one faculty member's own data.
 * Returns the caller's facultyId so the query can be scoped with it; an admin
 * gets `null`, meaning "not scoped".
 */
export async function requireFacultyScope(): Promise<
  | { ok: true; session: SessionPayload; facultyId: string | null }
  | { ok: false; response: NextResponse }
> {
  const auth = await requireApi(["FACULTY", "ADMIN"]);
  if (!auth.ok) return auth;

  if (auth.session.role === "ADMIN") {
    if (auth.session.facultyId) {
      return { ok: true, session: auth.session, facultyId: auth.session.facultyId };
    }
    return { ok: true, session: auth.session, facultyId: null };
  }
  if (!auth.session.facultyId) {
    return {
      ok: false,
      response: forbidden("This account is not linked to a faculty record."),
    };
  }
  return { ok: true, session: auth.session, facultyId: auth.session.facultyId };
}

/** Guard a server component. Redirects rather than returning a status. */
export async function requirePage(roles?: Role[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (roles && roles.length > 0 && !roles.includes(session.role)) {
    if (session.role === "ADMIN" && session.facultyId && roles.includes("FACULTY")) {
      return session;
    }
    redirect(dashboardPathFor(session.role));
  }
  return session;
}
