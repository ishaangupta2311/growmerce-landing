import "server-only";

import { cache } from "react";
import { notFound, redirect } from "next/navigation";

import { ensureAuthorProfile } from "@/lib/blog/author-profile";
import { requireSql } from "@/lib/blog/sql";
import { currentUser, supabaseServer } from "@/lib/supabase/server";
import { allows, type Grant, type Level } from "@/lib/team/permissions";
import { memberStanding } from "@/lib/team/store";

/**
 * Who may open /admin, what each of them may see there, and the one check
 * every admin page, layout and Server Action goes through.
 *
 * Signing in is Supabase's job, the same login partners use. Being on the
 * team is decided in two places:
 *
 * - **The Owner** is every address on AFFILIATE_ADMIN_EMAILS. An environment
 *   variable is outside everything a request can reach, so no bug, injection
 *   or careless UPDATE can lock the Owner out or make somebody else one. The
 *   Owner can do everything and cannot be changed from inside the app. (The
 *   name predates the team; renaming it would mean changing every deployment
 *   in the same breath as the code.)
 * - **Everyone else** is a row in `team.member` holding a role, managed on the
 *   Team page (migrations/0012_team.sql). Removing the row, or changing the
 *   role, applies on the person's very next request: nothing is cached past
 *   one render.
 *
 * Both are checked against a **verified** session — `currentUser()` calls
 * `getUser()`, which asks the auth server rather than trusting the cookie.
 * `src/proxy.ts` turns signed-out visitors away earlier, but it cannot know who
 * is on the team; this can, and it is the boundary.
 */

/**
 * The Owner list, lower-cased and de-duplicated.
 *
 * Read on every call rather than at module load: a serverless instance can
 * outlive an environment change, and the failure mode of a stale copy is
 * somebody who was removed still being the Owner.
 */
function ownerEmails(): Set<string> {
  const raw = process.env.AFFILIATE_ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(/[,\s]+/)
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** Whether an address is an Owner. An unset list means there is no Owner. */
export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ownerEmails().has(email.trim().toLowerCase());
}

export const OWNER_GRANT: Grant = { all: "edit", permissions: {} };

export type Standing = {
  owner: boolean;
  /** "Owner", "Admin", "Viewer" or a role somebody made. */
  roleName: string;
  roleId: string | null;
  grant: Grant;
  mustChangePassword: boolean;
  /** The name the team knows them by, before they set one themselves. */
  name: string | null;
};

type SignedIn = { id: string; email?: string | null };

/** Where somebody stands on the team, or null if they are not on it. One query per request. */
const standingOf = cache(async (userId: string, email: string): Promise<Standing | null> => {
  if (isOwnerEmail(email)) {
    return { owner: true, roleName: "Owner", roleId: null, grant: OWNER_GRANT, mustChangePassword: false, name: null };
  }
  const member = await memberStanding(userId);
  return member && { owner: false, ...member };
});

/** Whether this login is on the team, as the Owner or as a member. */
export async function isTeammate(user: SignedIn): Promise<boolean> {
  return (await standingOf(user.id, user.email?.trim().toLowerCase() ?? "")) !== null;
}

/**
 * Where somebody goes after signing in when nothing asked for anywhere in
 * particular: teammates to the admin, everybody else to their partner
 * dashboard.
 *
 * Teammates and partners share one login page, and a teammate is not a
 * partner. The partner dashboard's answer to a login with no partner account
 * is the application form — wrong for a teammate, who would fill it in to get
 * past it and end up a partner able to approve themselves.
 */
export async function landingFor(user: SignedIn | null | undefined): Promise<"/admin" | "/affiliates/dashboard"> {
  return user && (await isTeammate(user)) ? "/admin" : "/affiliates/dashboard";
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
  /** Display name, editable under My account. */
  name: string;
  /** The byline linked to this admin, used as the default author on a new post. */
  authorId: string | null;
  owner: boolean;
  roleName: string;
  roleId: string | null;
  grant: Grant;
};

/**
 * The signed-in teammate, before the two checks that can send them to a page
 * of their own: their second factor and a password somebody else chose. Only
 * those two pages call this directly; everything else calls `requireAdmin`.
 *
 * Two refusals, deliberately different. Somebody who is not signed in gets the
 * login page, because that is a state they can fix. Somebody who *is* signed
 * in and is not on the team gets a 404 — not a "you are not allowed" page,
 * which would confirm that /admin is an address worth coming back to with a
 * better session.
 */
export const requireTeamLogin = cache(async () => {
  const user = await currentUser();
  if (!user) redirect("/affiliates/login?next=/admin");

  const email = user.email?.trim().toLowerCase() ?? "";
  const standing = await standingOf(user.id, email);
  if (!standing) notFound();

  /* `user.factors` comes from the auth server's answer, not the cookie, so a
     session cannot hide its factors to skip the second step. */
  const hasSecondFactor = (user.factors ?? []).some((factor) => factor.status === "verified");
  let secondFactorPassed = true;
  if (hasSecondFactor) {
    const supabase = await supabaseServer();
    /* Verified claims: the signature is checked (or the auth server asked)
       before `aal` is believed. */
    const { data } = await supabase.auth.getClaims();
    secondFactorPassed = data?.claims.aal === "aal2";
  }

  return { user, email, standing, hasSecondFactor, secondFactorPassed };
});

/**
 * The signed-in teammate, or a refusal.
 *
 * Called by the admin layout, by every admin page, and by every admin action,
 * usually through `requireAccess`. A layout is not a security boundary in the
 * App Router — it does not re-render on a client-side navigation between its
 * children — so nothing can rely on it having run. `cache` collapses the
 * repeats into one check per request.
 */
export const requireAdmin = cache(async (): Promise<Admin> => {
  const { user, email, standing, secondFactorPassed } = await requireTeamLogin();
  if (!secondFactorPassed) redirect("/admin/verify");
  if (standing.mustChangePassword) redirect("/admin/password");

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const suggested =
    standing.name ??
    (typeof metadata.affiliate_name === "string" && metadata.affiliate_name.trim()
      ? metadata.affiliate_name.trim()
      : email.split("@")[0]);

  return {
    userId: user.id,
    email,
    owner: standing.owner,
    roleName: standing.roleName,
    roleId: standing.roleId,
    grant: standing.grant,
    ...(await adminProfile(email, suggested)),
  };
});

/**
 * The signed-in teammate, if their role reaches `level` on the tab `key`;
 * otherwise the same 404 as somebody not on the team. A tab you cannot open
 * does not exist, as far as you can tell.
 */
export async function requireAccess(key: string, level: Level = "view"): Promise<Admin> {
  const admin = await requireAdmin();
  if (!allows(admin.grant, key, level)) notFound();
  return admin;
}

/**
 * Whether the signed-in person is on the team, without refusing if they are
 * not.
 *
 * Only for deciding whether to show a link into /admin from a page anybody can
 * open — the public affiliate program page.
 */
export const optionalAdmin = cache(async (): Promise<{ userId: string; email: string } | null> => {
  const user = await currentUser();
  if (!user || !(await isTeammate(user))) return null;
  return { userId: user.id, email: user.email ?? "" };
});

/**
 * The admin's profile row, written the first time a teammate arrives.
 *
 * Found by email: whoever passes the check above is the admin whose row has
 * that address. The row carries no credential — Supabase holds the password —
 * only the display name and the identity that authorship columns point at. A
 * new admin also gets a byline, so their first post has an author without a
 * detour through the Authors tab.
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
