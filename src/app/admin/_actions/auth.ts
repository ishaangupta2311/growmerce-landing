"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Sql } from "postgres";
import { sessionSecret } from "@/lib/auth/cookie";
import { burnPasswordCheck, hashPassword, passwordProblem, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { loginRetryAfter, recordLoginAttempt, throttleKeys } from "@/lib/auth/throttle";
import { ensureAuthorProfile } from "@/lib/blog/author-profile";
import { db } from "@/lib/db";
import { clientKeyFromHeaders } from "@/lib/preview/rate-limit";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type LoginState =
  | {
      error?: string;
      fieldErrors?: { email?: string; password?: string };
      email?: string;
    }
  | undefined;

/**
 * Every failure a guesser could learn from reads the same: wrong email, wrong
 * password and a locked account differ only once the lockout is real.
 */
const INVALID = "Invalid email or password.";

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const fieldErrors: NonNullable<LoginState>["fieldErrors"] = {};
  if (!email) fieldErrors.email = "Enter your email address.";
  else if (email.length > 254 || !EMAIL.test(email)) fieldErrors.email = "Enter a valid email address.";
  if (!password) fieldErrors.password = "Enter your password.";
  if (fieldErrors.email || fieldErrors.password) return { fieldErrors, email };

  /* A password this long cannot be one of ours (bcrypt stops at 72 bytes) and
     hashing megabytes of input is a cheap way to burn our CPU. */
  if (password.length > 256) return { error: INVALID, email };

  const secret = sessionSecret();
  const sql = db();
  if (!secret || !sql) {
    console.error(`[admin] login unavailable — ${!secret ? "SESSION_SECRET" : "DATABASE_URL"} is not configured`);
    return { error: "Sign-in is not configured on this server yet.", email };
  }

  try {
    const keys = await throttleKeys(clientKeyFromHeaders(await headers()), email, secret);
    const wait = await loginRetryAfter(sql, keys);
    if (wait > 0) {
      return {
        error: `Too many failed attempts. Try again in ${wait} minute${wait === 1 ? "" : "s"}.`,
        email,
      };
    }

    const adminId = await checkCredentials(sql, email, password);
    await recordLoginAttempt(sql, keys, adminId !== null);
    if (!adminId) return { error: INVALID, email };

    await sql`update blog.admin_user set last_login_at = now() where id = ${adminId}`;
    await createSession(adminId);
  } catch (err) {
    /* Message only: a postgres.js error carries its query parameters, and one
       of those is the email being tried. */
    const why = err instanceof Error ? err.message : String(err);
    console.error(`[admin] login failed — ${why.slice(0, 200)}`);
    return { error: "Sign-in is temporarily unavailable. Please try again.", email };
  }

  redirect("/admin");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

/** The admin's id when the credentials match, otherwise null. */
async function checkCredentials(sql: Sql, email: string, password: string): Promise<string | null> {
  const [user] = await sql<{ id: string; password_hash: string }[]>`
    select id, password_hash from blog.admin_user where email = ${email}
  `;
  if (user) return (await verifyPassword(password, user.password_hash)) ? user.id : null;

  const bootstrapped = await bootstrapFromEnvironment(sql, email, password);
  if (bootstrapped) return bootstrapped;

  await burnPasswordCheck(password);
  return null;
}

/**
 * First-run convenience for deployments where running a script is awkward:
 * while there are no admin accounts at all, ADMIN_EMAIL / ADMIN_PASSWORD from
 * the server environment are accepted once, and turned into a real account
 * with a bcrypt hash. From then on the database is the only source of truth —
 * the variables can (and should) be removed, and changing them does nothing.
 */
async function bootstrapFromEnvironment(sql: Sql, email: string, password: string): Promise<string | null> {
  const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const envPassword = process.env.ADMIN_PASSWORD ?? "";
  if (!envEmail || !envPassword || email !== envEmail) return null;

  if (envPassword === "CHANGE_THIS_PASSWORD" || passwordProblem(envPassword)) {
    console.warn("[admin] ADMIN_PASSWORD is the placeholder or too weak — first-run sign-in is disabled");
    return null;
  }

  const [{ count }] = await sql<{ count: number }[]>`select count(*)::int as count from blog.admin_user`;
  if (count > 0) return null;

  /* Compare digests so the comparison is constant-time and length-blind. */
  const given = createHash("sha256").update(password).digest();
  const expected = createHash("sha256").update(envPassword).digest();
  if (!timingSafeEqual(given, expected)) return null;

  const name = process.env.ADMIN_NAME?.trim() || email.split("@")[0];
  const [created] = await sql<{ id: string }[]>`
    insert into blog.admin_user (email, name, password_hash)
    values (${email}, ${name}, ${await hashPassword(password)})
    on conflict (email) do nothing
    returning id
  `;
  const id = created?.id ?? (await sql<{ id: string }[]>`select id from blog.admin_user where email = ${email}`)[0]?.id;
  if (!id) return null;

  await ensureAuthorProfile(sql, id, name);
  console.info("[admin] created the first admin account from ADMIN_EMAIL / ADMIN_PASSWORD");
  return id;
}
