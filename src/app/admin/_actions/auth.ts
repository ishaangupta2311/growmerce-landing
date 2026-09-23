"use server";

import { redirect } from "next/navigation";

import { supabaseServer } from "@/lib/supabase/server";

/**
 * Signing out of /admin.
 *
 * The same Supabase session a partner signs out of, so this ends both: an
 * admin who is also a partner is signed out of their partner dashboard too.
 * That is the honest outcome of one login rather than a side effect — there is
 * no second session to leave behind.
 *
 * Back to the sign-in page with `next` pointing here, so signing straight back
 * in lands in the admin rather than on a partner dashboard they may not have.
 */
export async function signOutAdmin(): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/affiliates/login?next=/admin");
}
