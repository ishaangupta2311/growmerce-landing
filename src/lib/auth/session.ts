import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import { requireSql } from "@/lib/blog/sql";
import {
  SESSION_TTL_SECONDS,
  randomToken,
  readSessionToken,
  readSessionValue,
  sessionCookieName,
  sessionCookieSecure,
  sessionSecret,
  sha256Hex,
  signSessionValue,
} from "./cookie";

/**
 * The data access layer for "who is signed in".
 *
 * Proxy (src/proxy.ts) turns away requests with no valid cookie before they
 * render, but it cannot see the database, so it cannot know a session was
 * logged out. Every admin page, layout and Server Action therefore calls
 * `requireAdmin()` here, which checks the session row itself. That check —
 * not the proxy, and not hiding a button — is the security boundary.
 */

export type Admin = {
  id: string;
  email: string;
  name: string;
  /** The author profile linked to this account, used as the default byline. */
  authorId: string | null;
  /** Hash of this browser's session, so "sign out other devices" can spare it. */
  sessionId: string;
};

export class SessionSecretMissingError extends Error {
  constructor() {
    super("SESSION_SECRET is missing or shorter than 32 characters.");
    this.name = "SessionSecretMissingError";
  }
}

export async function createSession(adminId: string): Promise<void> {
  const secret = sessionSecret();
  if (!secret) throw new SessionSecretMissingError();

  const sql = requireSql();
  const token = randomToken();
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const userAgent = (await headers()).get("user-agent")?.slice(0, 300) ?? null;

  /* Housekeeping rides along with a login rather than needing a cron job. */
  await sql`delete from blog.session where expires_at < now()`;
  await sql`
    insert into blog.session (id, admin_user_id, expires_at, user_agent)
    values (${await sha256Hex(token)}, ${adminId}, ${new Date(expiresAt * 1000)}, ${userAgent})
  `;

  (await cookies()).set(sessionCookieName(), await signSessionValue(token, expiresAt, secret), {
    httpOnly: true,
    secure: sessionCookieSecure(),
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt * 1000),
  });
}

/**
 * The signed-in admin, or null. Cached per request, so a layout, a page and
 * the components under them share one lookup.
 */
export const getCurrentAdmin = cache(async (): Promise<Admin | null> => {
  const value = (await cookies()).get(sessionCookieName())?.value;
  if (!value) return null;

  const session = await readSessionValue(value, sessionSecret());
  if (!session) return null;

  const sql = db();
  if (!sql) return null;

  const id = await sha256Hex(session.token);
  const [row] = await sql<{ id: string; email: string; name: string; author_id: string | null }[]>`
    select a.id, a.email, a.name, au.id as author_id
    from blog.session s
    join blog.admin_user a on a.id = s.admin_user_id
    left join blog.author au on au.admin_user_id = a.id
    where s.id = ${id} and s.expires_at > now()
  `;
  return row ? { id: row.id, email: row.email, name: row.name, authorId: row.author_id, sessionId: id } : null;
});

/** The signed-in admin; anyone else is sent to the login page. */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/** Deletes this browser's session row and its cookie. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const value = store.get(sessionCookieName())?.value;

  if (value) {
    const token = await readSessionToken(value, sessionSecret());
    const sql = db();
    if (token && sql) {
      await sql`delete from blog.session where id = ${await sha256Hex(token)}`;
    }
  }

  store.delete({ name: sessionCookieName(), path: "/", secure: sessionCookieSecure(), httpOnly: true });
}

/** Signs an account out everywhere except, optionally, the current browser. */
export async function destroyOtherSessions(adminId: string, keepSessionId: string | null): Promise<number> {
  const sql = requireSql();
  const rows = keepSessionId
    ? await sql`delete from blog.session where admin_user_id = ${adminId} and id <> ${keepSessionId} returning id`
    : await sql`delete from blog.session where admin_user_id = ${adminId} returning id`;
  return rows.length;
}
