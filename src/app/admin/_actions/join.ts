"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";

import { noteActivity } from "@/lib/blog/action-guard";
import type { ActionResult } from "@/lib/blog/types";
import { currentUser, supabaseServer } from "@/lib/supabase/server";
import { AuthAdminUnavailableError, createLogin } from "@/lib/team/auth-admin";
import { acceptInvite, inviteByTokenHash, loginByEmail } from "@/lib/team/store";

/**
 * Accepting an invite to the team, from the link in the email
 * (/admin/join/<token>). The only admin actions anybody can call without
 * being on the team, so each one proves the invite first: the token's hash
 * must match an open invite, and the login it ends with must be the invited
 * address.
 */

const MIN_PASSWORD = 8;
const TOKEN = /^[0-9a-f]{64}$/;

function hashOf(token: unknown): string | null {
  return typeof token === "string" && TOKEN.test(token) ? createHash("sha256").update(token).digest("hex") : null;
}

const GONE = "This invite has expired, or has already been used. Ask for a new one.";
const PARTNER =
  "This login is an affiliate partner's, and can't also be on the admin team. Ask for an invite to another address.";

/**
 * For somebody with no login yet: makes one for the invited address with the
 * password they choose, joins them to the team and signs them in. Opening the
 * emailed link is what proves the address is theirs.
 */
export async function joinWithPasswordAction(
  token: unknown,
  values: { password: unknown; confirm: unknown },
): Promise<ActionResult<{ next: string }>> {
  const tokenHash = hashOf(token);
  const invite = tokenHash ? await inviteByTokenHash(tokenHash) : null;
  if (!tokenHash || !invite) return { ok: false, error: GONE };

  const password = typeof values.password === "string" ? values.password : "";
  const confirm = typeof values.confirm === "string" ? values.confirm : "";
  if (password.length < MIN_PASSWORD || password.length > 200) {
    return {
      ok: false,
      error: `Use at least ${MIN_PASSWORD} characters.`,
      fieldErrors: { password: `Use at least ${MIN_PASSWORD} characters.` },
    };
  }
  if (password !== confirm) {
    return {
      ok: false,
      error: "Those two passwords do not match.",
      fieldErrors: { confirm: "Those two passwords do not match." },
    };
  }
  if (await loginByEmail(invite.email)) {
    return { ok: false, error: "This address already has a login. Sign in with it to accept the invite." };
  }

  let userId: string;
  try {
    ({ userId } = await createLogin(invite.email, password, invite.name));
  } catch (err) {
    if (err instanceof AuthAdminUnavailableError) {
      console.error("[team] cannot create a login for an invite — SUPABASE_SECRET_KEY is unset");
      return {
        ok: false,
        error: "We couldn't set up your login just now. Ask whoever invited you to check the admin's settings.",
      };
    }
    throw err;
  }

  const joined = await acceptInvite(tokenHash, { userId, email: invite.email });
  if (!joined) return { ok: false, error: GONE };

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email: invite.email, password });
  await noteActivity({ email: invite.email, name: invite.name }, `Joined the team as ${joined.role.name}`);
  /* The login and the membership exist either way; if signing in here
     failed, the login page finishes the job. */
  return { ok: true, data: { next: error ? "/affiliates/login?next=/admin" : "/admin" } };
}

/** For somebody signed in as another address: out, and back to the invite. */
export async function signOutForInviteAction(token: unknown): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect(typeof token === "string" && TOKEN.test(token) ? `/admin/join/${token}` : "/affiliates/login");
}

/** For somebody already signed in as the invited address. */
export async function acceptInviteAction(token: unknown): Promise<ActionResult<{ next: string }>> {
  const tokenHash = hashOf(token);
  const invite = tokenHash ? await inviteByTokenHash(tokenHash) : null;
  if (!tokenHash || !invite) return { ok: false, error: GONE };

  const user = await currentUser();
  const email = user?.email?.trim().toLowerCase();
  if (!user || email !== invite.email) {
    return { ok: false, error: `Sign in as ${invite.email} to accept this invite.` };
  }
  const login = await loginByEmail(email);
  if (login?.partner) return { ok: false, error: PARTNER };

  let joined;
  try {
    joined = await acceptInvite(tokenHash, { userId: user.id, email });
  } catch (err) {
    /* The database's own guard (migrations/0012_team.sql): a partner
       application that raced this one got there first. */
    if ((err as { constraint_name?: string } | null)?.constraint_name === "member_not_partner") {
      return { ok: false, error: PARTNER };
    }
    throw err;
  }
  if (!joined) return { ok: false, error: GONE };
  await noteActivity({ email, name: invite.name }, `Joined the team as ${joined.role.name}`);
  return { ok: true, data: { next: "/admin" } };
}
