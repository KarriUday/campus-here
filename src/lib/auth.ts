import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@/generated/prisma/enums";

export const SESSION_COOKIE = "ch_session";

/** Sessions last one working day. */
const SESSION_TTL_SECONDS = 8 * 60 * 60;

/**
 * Claims carried in the session token.
 *
 * `studentId` / `facultyId` are denormalised into the token so that
 * role-scoped queries ("only this guide's groups") do not need an extra
 * lookup on every request. They are never trusted for authorisation on their
 * own — `role` is what gates access.
 */
export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: Role;
  studentId?: string;
  facultyId?: string;
};

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET is missing or shorter than 32 characters. See .env.example.",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setIssuer("campus-here")
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

/** Verify a token. Returns null for anything invalid, expired or malformed. */
export async function verifySession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: "campus-here",
    });
    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }
    return {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role as Role,
      studentId:
        typeof payload.studentId === "string" ? payload.studentId : undefined,
      facultyId:
        typeof payload.facultyId === "string" ? payload.facultyId : undefined,
    };
  } catch {
    return null;
  }
}

/** Read and verify the session from the request cookie. Server-side only. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Landing route for a role, used after login and by the proxy on mismatch. */
export function dashboardPathFor(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "FACULTY":
      return "/faculty";
    case "STUDENT":
    default:
      return "/student";
  }
}
