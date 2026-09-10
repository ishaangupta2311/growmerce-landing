import "server-only";

import { cache } from "react";
import { notFound, redirect } from "next/navigation";

import { currentUser } from "@/lib/supabase/server";

/**
 * Who is allowed to approve a partner, change a commission rate, and record a
 * payout — and the reason that list lives in an environment variable rather
 * than in the database.
 *
 * Admin is the one privilege the application must have no way to grant itself.
 * A column on `affiliate.partner` would be one SQL-injection or one careless
 * `updatePartnerProfile` away from a partner approving their own application
 * and setting their own rate to 100%; an env var is outside everything the
 * request can reach. Adding an admin costs a deploy, which for a list this
 * short is the feature, not the cost.
 *
 * It is checked against the email on a **verified** Supabase session —
 * `currentUser()` calls `getUser()`, which validates the JWT with the auth
 * server rather than trusting the cookie — so a forged cookie naming an admin
 * address gets nowhere.
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
 * An unset or empty `AFFILIATE_ADMIN_EMAILS` means *nobody* is an admin, which
 * is the same choice `AFFILIATE_INGEST_SECRET` makes: a deployment that cannot
 * say who is trusted has not thereby trusted everyone. The cost of getting it
 * wrong in this direction is an admin locked out for as long as it takes to set
 * a variable; in the other, it is a stranger approving partners.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().has(email.trim().toLowerCase());
}

export type AdminSession = { userId: string; email: string };

/**
 * The signed-in admin, or a refusal.
 *
 * Two different refusals, deliberately. Someone who is not signed in gets the
 * login page, because that is a state they can fix. Someone who *is* signed in
 * and is not an admin gets a 404 — not a "you are not allowed" page, which
 * would confirm that `/affiliates/admin` is a real address worth coming back
 * to with a better session.
 *
 * Called by the admin layout, by every admin page, and by every admin action.
 * The layout is not a security boundary in the App Router — it does not
 * re-render on a client-side navigation between its children — so the pages
 * cannot rely on it having run. React's `cache` collapses the repeats into one
 * check per request.
 */
export const requireAdmin = cache(async (): Promise<AdminSession> => {
  const user = await currentUser();
  if (!user) redirect("/affiliates/login?next=/affiliates/admin");

  if (!isAdminEmail(user.email)) notFound();

  return { userId: user.id, email: user.email ?? "" };
});

/**
 * Whether the signed-in person is an admin, without refusing if they are not.
 *
 * Only for deciding whether to show the link into the admin area from a
 * dashboard an admin happens to also have a partner account on.
 */
export const optionalAdmin = cache(async (): Promise<AdminSession | null> => {
  const user = await currentUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return { userId: user.id, email: user.email ?? "" };
});
