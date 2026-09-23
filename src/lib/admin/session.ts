import "server-only";

import { cache } from "react";
import { notFound, redirect } from "next/navigation";

import { ensureAuthorProfile } from "@/lib/blog/author-profile";
import { requireSql } from "@/lib/blog/sql";
import { currentUser } from "@/lib/supabase/server";

/**
 * Who may open /admin — the blog and the affiliate program both — and the one
 * check every admin page, layout and Server Action goes through.
 *
 * Signing in is Supabase's job, the same login partners use. Being an admin is
 * this file's, and it is decided by an environment variable rather than by
 * anything in the database. Admin is the one privilege the application must
 * have no way to grant itself: a column on `affiliate.partner` or
 * `blog.admin_user` would be one SQL injection or one careless UPDATE away
 * from a partner approving their own application and setting their own rate
 * to 100%. An env var is outside everything a request can reach. Adding an
 * admin costs a deploy, which for a list this short is the feature.
 *
 * The variable is still called AFFILIATE_ADMIN_EMAILS because it predates the
 * blog moving in, and renaming it would mean changing every deployment in the
 * same breath as the code. It now gates all of /admin.
 *
 * It is checked against the email on a **verified** session — `currentUser()`
 * calls `getUser()`, which asks the auth server rather than trusting the
 * cookie — so a forged cookie naming an admin address gets nowhere.
 * `src/proxy.ts` turns signed-out visitors away earlier, but it cannot know who
 * is on the list; this can, and it is the boundary.
 */

/**
 * The allowlist, lower-cased and de-duplicated.
 *
 * Read on every call rather than at module load: a serverless instance can
 * outlive an environment change, and the failure mode of a stale copy is
 * somebody who was removed still being an admin.
 */
function adminEmails(): Set<string> {
  const raw = process.env.AFFILIATE_ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(/[,\s]+/)
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Whether an address is on the list.
 *
 * An unset or empty list means *nobody* is an admin — the same choice
 * `AFFILIATE_INGEST_SECRET` makes. A deployment that cannot say who is trusted
 * has not thereby trusted everyone. Wrong in this direction costs an admin a
 * few minutes setting a variable; wrong in the other, a stranger approving
 * partners and publishing to the blog.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().has(email.trim().toLowerCase());
}

export type Admin = {
  /**
   * The `blog.admin_user` row: what `created_by`, `updated_by` and
   * `uploaded_by` point at, and what the byline hangs off.
   */
  id: string;
  /** The Supabase user. */
  userId: string;
  email: string;
  /** Display name, editable under Blog → Settings. */
  name: string;
  /** The byline linked to this admin, used as the default author on a new post. */
  authorId: string | null;
};

/**
 * The signed-in admin, or a refusal.
 *
 * Two refusals, deliberately different. Somebody who is not signed in gets the
 * login page, because that is a state they can fix. Somebody who *is* signed
 * in and is not on the list gets a 404 — not a "you are not allowed" page,
 * which would confirm that /admin is an address worth coming back to with a
 * better session.
 *
 * Called by the admin layout, by every admin page, and by every admin action.
 * A layout is not a security boundary in the App Router — it does not
 * re-render on a client-side navigation between its children — so nothing can
 * rely on it having run. `cache` collapses the repeats into one check per
 * request.
 */
export const requireAdmin = cache(async (): Promise<Admin> => {
  const user = await currentUser();
  if (!user) redirect("/affiliates/login?next=/admin");

  const email = user.email?.trim().toLowerCase() ?? "";
  if (!isAdminEmail(email)) notFound();

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const suggested =
    typeof metadata.affiliate_name === "string" && metadata.affiliate_name.trim()
      ? metadata.affiliate_name.trim()
      : email.split("@")[0];

  return { userId: user.id, email, ...(await adminProfile(email, suggested)) };
});

/**
 * Whether the signed-in person is an admin, without refusing if they are not.
 *
 * Only for deciding whether to show a link into /admin from somewhere an admin
 * might also be — their own partner dashboard. Touches nothing in the database.
 */
export const optionalAdmin = cache(async (): Promise<{ userId: string; email: string } | null> => {
  const user = await currentUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return { userId: user.id, email: user.email ?? "" };
});

/**
 * The admin's profile row, written the first time an allowed address arrives.
 *
 * Found by email because email is what the allowlist names: whoever passes the
 * check above is the admin whose row has that address. The row carries no
 * credential — Supabase holds the password — only the display name and the
 * identity that authorship columns point at. A new admin also gets a byline,
 * so their first post has an author without a detour through Settings.
 *
 * `on conflict do nothing` and a second read, rather than an upsert, because
 * two tabs opening /admin for the first time at once must not both create a
 * byline; whichever insert loses simply reads the winner's row.
 */
async function adminProfile(
  email: string,
  suggestedName: string,
): Promise<{ id: string; name: string; authorId: string | null }> {
  const sql = requireSql();
  const find = async () => {
    const [row] = await sql<{ id: string; name: string; author_id: string | null }[]>`
      select a.id, a.name, au.id as author_id
      from blog.admin_user a
      left join blog.author au on au.admin_user_id = a.id
      where a.email = ${email}
    `;
    return row;
  };

  let row = await find();
  if (!row) {
    const name = suggestedName.slice(0, 100);
    const [created] = await sql<{ id: string }[]>`
      insert into blog.admin_user (email, name)
      values (${email}, ${name})
      on conflict (email) do nothing
      returning id
    `;
    if (created) await ensureAuthorProfile(sql, created.id, name);
    row = await find();
  }
  if (!row) throw new Error("Could not load or create the admin profile.");

  return { id: row.id, name: row.name, authorId: row.author_id };
}
