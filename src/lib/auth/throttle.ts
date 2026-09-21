import "server-only";

import type { Sql } from "postgres";
import { sha256Hex } from "./cookie";

/**
 * Login throttling, kept in Postgres so it holds across serverless instances
 * (an in-memory counter resets with every cold start, which is exactly when a
 * scripted guesser would be hitting us).
 *
 * Two budgets over the same window:
 *   - per email, tight: protects one account from a slow, distributed guess
 *   - per IP, looser: protects every account from one noisy source
 *
 * Only failures count, and a success clears that account's failures, so an
 * admin who fat-fingers twice and then gets in starts fresh.
 */

const WINDOW_MINUTES = 15;
const EMAIL_LIMIT = 5;
const IP_LIMIT = 20;

export type ThrottleKeys = { ipHash: string; emailHash: string };

/**
 * Keys are salted with SESSION_SECRET so the table cannot be reversed with a
 * list of likely emails or the IPv4 space.
 */
export async function throttleKeys(ip: string, email: string, salt: string): Promise<ThrottleKeys> {
  return {
    ipHash: await sha256Hex(`${salt}:ip:${ip}`),
    emailHash: await sha256Hex(`${salt}:email:${email}`),
  };
}

/** Minutes until another attempt is allowed, or 0 when it is allowed now. */
export async function loginRetryAfter(sql: Sql, keys: ThrottleKeys): Promise<number> {
  const [row] = await sql<{ email_fails: number; ip_fails: number; oldest: Date | null }[]>`
    select
      count(*) filter (where email_hash = ${keys.emailHash})::int as email_fails,
      count(*) filter (where ip_hash = ${keys.ipHash})::int as ip_fails,
      min(created_at) as oldest
    from blog.login_attempt
    where succeeded = false
      and created_at > now() - make_interval(mins => ${WINDOW_MINUTES})
      and (email_hash = ${keys.emailHash} or ip_hash = ${keys.ipHash})
  `;

  if (row.email_fails < EMAIL_LIMIT && row.ip_fails < IP_LIMIT) return 0;
  const oldest = row.oldest ? new Date(row.oldest).getTime() : Date.now();
  const freeAt = oldest + WINDOW_MINUTES * 60_000;
  return Math.max(1, Math.ceil((freeAt - Date.now()) / 60_000));
}

export async function recordLoginAttempt(sql: Sql, keys: ThrottleKeys, succeeded: boolean): Promise<void> {
  if (succeeded) {
    await sql`
      delete from blog.login_attempt
      where email_hash = ${keys.emailHash} and succeeded = false
    `;
  } else {
    await sql`
      insert into blog.login_attempt (ip_hash, email_hash, succeeded)
      values (${keys.ipHash}, ${keys.emailHash}, false)
    `;
  }
  /* Nothing older than a day can affect a 15-minute window. */
  await sql`delete from blog.login_attempt where created_at < now() - interval '1 day'`;
}
