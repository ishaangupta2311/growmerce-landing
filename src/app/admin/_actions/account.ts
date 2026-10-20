"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireTeamLogin } from "@/lib/admin/session";
import { adminAction, noteActivity } from "@/lib/blog/action-guard";
import { requireSql } from "@/lib/blog/sql";
import type { ActionResult } from "@/lib/blog/types";
import { requireSupabaseEnv } from "@/lib/supabase/env";
import { safeNext } from "@/lib/supabase/safe-next";
import { supabaseServer } from "@/lib/supabase/server";
import { renameMember, setMustChangePassword } from "@/lib/team/store";

/**
 * What every teammate can do to their own account, whatever their role: their
 * name, their password and their two-step login. Nothing here takes a user id;
 * each acts on whoever is signed in.
 */

const MIN_PASSWORD = 8;
const CODE = /^\d{6}$/;

const profileSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(100, "Keep it under 100 characters."),
});

export async function updateProfileAction(values: unknown): Promise<ActionResult> {
  return adminAction("update profile", null, async (admin) => {
    const parsed = profileSchema.safeParse(values);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0].message, fieldErrors: { name: parsed.error.issues[0].message } };
    }
    const sql = requireSql();
    await sql`update blog.admin_user set name = ${parsed.data.name}, updated_at = now() where id = ${admin.id}`;
    if (!admin.owner) await renameMember(admin.userId, parsed.data.name);
    /* The header shows the name; send the re-rendered page with the reply. */
    refresh();
    return { ok: true, data: undefined, message: "Profile saved." };
  });
}

/**
 * Whether `password` is this person's current password, asked of the auth
 * server on a throwaway client so the check neither touches nor replaces the
 * session in their cookies. The session it opens is ended straight away.
 */
async function isCurrentPassword(email: string, password: string): Promise<boolean> {
  const { url, anonKey } = requireSupabaseEnv();
  const probe = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { error } = await probe.auth.signInWithPassword({ email, password });
  if (error) return false;
  await probe.auth.signOut({ scope: "local" });
  return true;
}

/**
 * Sets a new password. Asks for the current one, except straight after
 * signing in with a password somebody else chose, which is the case this
 * page exists for: the person has just typed it.
 */
export async function changePasswordAction(values: {
  current?: unknown;
  password: unknown;
  confirm: unknown;
}): Promise<ActionResult> {
  const { user, email, standing, secondFactorPassed } = await requireTeamLogin();
  if (!secondFactorPassed) redirect("/admin/verify");

  const password = typeof values.password === "string" ? values.password : "";
  const confirm = typeof values.confirm === "string" ? values.confirm : "";
  if (password.length < MIN_PASSWORD || password.length > 200) {
    return { ok: false, error: `Use at least ${MIN_PASSWORD} characters.`, fieldErrors: { password: `Use at least ${MIN_PASSWORD} characters.` } };
  }
  if (password !== confirm) {
    return { ok: false, error: "Those two passwords do not match.", fieldErrors: { confirm: "Those two passwords do not match." } };
  }

  if (!standing.mustChangePassword) {
    const current = typeof values.current === "string" ? values.current : "";
    if (!current || !(await isCurrentPassword(email, current))) {
      return { ok: false, error: "Your current password is not right.", fieldErrors: { current: "That is not your current password." } };
    }
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    /* Supabase refuses a password equal to the old one, or one its policy
       finds weak, and says why in a sentence fit to show. */
    return { ok: false, error: error.message };
  }

  if (!standing.owner) await setMustChangePassword(user.id, false);
  await noteActivity({ email, name: standing.name ?? email }, "Changed their password");
  return { ok: true, data: undefined, message: "Password changed." };
}

/* ---------------------------------------------------------------------------
   Two-step login
--------------------------------------------------------------------------- */

const FRIENDLY_NAME = "Growmerce admin";

/**
 * Starts turning two-step login on: a new authenticator secret, shown as a QR
 * code, that only counts once a code from it is confirmed below. A half-done
 * attempt from before is cleared first, or Supabase refuses a second factor
 * with the same name.
 */
export async function startTwoStepAction(): Promise<ActionResult<{ factorId: string; qrCode: string; secret: string }>> {
  return adminAction("start two-step login", null, async () => {
    const supabase = await supabaseServer();
    const listed = await supabase.auth.mfa.listFactors();
    if (listed.error) throw listed.error;
    if (listed.data.totp.length > 0) return { ok: false, error: "Two-step login is already on." };
    for (const factor of listed.data.all) {
      if (factor.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }

    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: FRIENDLY_NAME });
    if (error) throw error;
    return { ok: true, data: { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret } };
  });
}

export async function confirmTwoStepAction(factorId: unknown, code: unknown): Promise<ActionResult> {
  return adminAction("confirm two-step login", null, async (admin) => {
    if (typeof factorId !== "string" || typeof code !== "string" || !CODE.test(code.trim())) {
      return { ok: false, error: "Enter the 6-digit code from your app.", fieldErrors: { code: "Enter the 6-digit code." } };
    }
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    if (error) {
      return { ok: false, error: "That code didn't match. Check your phone's clock, then try the next code.", fieldErrors: { code: "That code didn't match." } };
    }
    await noteActivity(admin, "Turned on two-step login");
    refresh();
    return { ok: true, data: undefined, message: "Two-step login is on." };
  });
}

export async function turnOffTwoStepAction(): Promise<ActionResult> {
  return adminAction("turn off two-step login", null, async (admin) => {
    const supabase = await supabaseServer();
    const listed = await supabase.auth.mfa.listFactors();
    if (listed.error) throw listed.error;
    for (const factor of listed.data.all) {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
      if (error) throw error;
    }
    await noteActivity(admin, "Turned off two-step login");
    refresh();
    return { ok: true, data: undefined, message: "Two-step login is off." };
  });
}

/**
 * The second step of signing in: a code from the authenticator app lifts the
 * session to `aal2`, which `requireAdmin` asks for once a factor exists.
 */
export async function verifySignInCodeAction(code: unknown, next: unknown): Promise<ActionResult<{ next: string }>> {
  const { secondFactorPassed } = await requireTeamLogin();
  const destination = safeNext(typeof next === "string" ? next : null, "/admin");
  if (secondFactorPassed) return { ok: true, data: { next: destination } };

  if (typeof code !== "string" || !CODE.test(code.trim())) {
    return { ok: false, error: "Enter the 6-digit code from your app." };
  }
  const supabase = await supabaseServer();
  const listed = await supabase.auth.mfa.listFactors();
  const factor = listed.data?.totp[0];
  if (!factor) return { ok: true, data: { next: destination } };

  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: code.trim() });
  if (error) return { ok: false, error: "That code didn't match. Check your phone's clock, then try the next code." };
  return { ok: true, data: { next: destination } };
}
