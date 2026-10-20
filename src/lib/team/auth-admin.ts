import "server-only";

import { randomInt } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

import { supabaseEnv } from "@/lib/supabase/env";

/**
 * Making and changing other people's logins: the one place the admin talks to
 * Supabase Auth with its secret key rather than as the person signed in.
 *
 * SUPABASE_SECRET_KEY is the project's secret key (Project Settings → API
 * Keys: an `sb_secret_…` key, or the older `service_role` one). It can do
 * anything to any login and skips row-level security, so it is read only
 * here, only on the server, and only by the Team actions after their checks.
 * Unset, adding teammates by invite still works for people who already have a
 * login; creating logins and resetting passwords say what is missing.
 */

export class AuthAdminUnavailableError extends Error {
  constructor() {
    super("Set SUPABASE_SECRET_KEY on this site to create logins and reset passwords.");
    this.name = "AuthAdminUnavailableError";
  }
}

function authAdmin() {
  const env = supabaseEnv();
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!env || !key) throw new AuthAdminUnavailableError();
  return createClient(env.url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  }).auth.admin;
}

export function authAdminConfigured(): boolean {
  return Boolean(supabaseEnv() && process.env.SUPABASE_SECRET_KEY?.trim());
}

/**
 * A password for somebody else to type once and replace: four groups of four
 * from an alphabet with no look-alikes (no 0/o, 1/l/i), about 80 bits.
 */
export function temporaryPassword(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const chars = Array.from({ length: 16 }, () => alphabet[randomInt(alphabet.length)]);
  return [0, 4, 8, 12].map((at) => chars.slice(at, at + 4).join("")).join("-");
}

/**
 * A confirmed login. Confirmed because whoever reaches this has either chosen
 * the address themselves from an emailed invite link (proof enough that they
 * read that inbox), or is a teammate creating the login on purpose.
 */
export async function createLogin(email: string, password: string, name: string): Promise<{ userId: string }> {
  const { data, error } = await authAdmin().createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (error || !data.user) throw new Error(`createUser failed: ${error?.message ?? "no user returned"}`);
  return { userId: data.user.id };
}

export async function setPassword(userId: string, password: string): Promise<void> {
  const { error } = await authAdmin().updateUserById(userId, { password });
  if (error) throw new Error(`updateUserById failed: ${error.message}`);
}

/**
 * Turns off somebody's two-step login, for a teammate who has lost their
 * phone. They sign in with their password alone until they turn it on again.
 */
export async function removeSecondFactors(userId: string): Promise<number> {
  const admin = authAdmin();
  const { data, error } = await admin.mfa.listFactors({ userId });
  if (error) throw new Error(`listFactors failed: ${error.message}`);
  for (const factor of data.factors) {
    const removed = await admin.mfa.deleteFactor({ userId, id: factor.id });
    if (removed.error) throw new Error(`deleteFactor failed: ${removed.error.message}`);
  }
  return data.factors.length;
}
