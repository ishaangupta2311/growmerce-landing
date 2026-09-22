import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { currentUser } from "@/lib/supabase/server";

import { partnerByUserId } from "./store";
import type { Partner } from "./types";

/**
 * The data-access layer for the affiliate dashboard: the one function that
 * decides whether the person asking is allowed to see a partner's money.
 *
 * Everything that reads affiliate data goes through here — pages, Server
 * Actions, all of it — and takes the `partnerId` it needs from the returned
 * object rather than from a URL, a form field or a prop. That is the whole
 * design. A partner id that arrives from the client is a partner id an attacker
 * can change, and the dashboard has no route or form that accepts one.
 *
 * `src/proxy.ts` also keeps signed-out visitors off `/affiliates/dashboard`,
 * and refreshes an expiring session on the way in so the rotated tokens reach
 * the browser (see `src/lib/supabase/proxy.ts`). That is a gate and a
 * courtesy, not a defence: it verifies the token's signature, not the partner
 * behind it. The real check is here, and it is the one every query depends on.
 *
 * `cache` is React's per-render memo. A dashboard page that reads the partner
 * in the layout, the page and two components makes one call to Supabase and one
 * to Postgres, not four.
 */

export type PartnerSession = {
  partner: Partner;
  /** The Supabase user id. Rarely needed directly; the partner carries it too. */
  userId: string;
};

/**
 * The signed-in partner, or null — for pages that render differently rather
 * than refusing, such as the public program page's "go to your dashboard" link.
 */
export const optionalPartner = cache(async (): Promise<PartnerSession | null> => {
  const user = await currentUser();
  if (!user) return null;

  const partner = await partnerByUserId(user.id);
  if (!partner) return null;

  return { partner, userId: user.id };
});

/**
 * The signed-in partner, or a redirect.
 *
 * Three states, three destinations, and the middle one is the interesting one:
 * somebody with a Supabase login but no partner row. That happens legitimately
 * — they confirmed their email and closed the tab before the application form
 * — so sending them to `/affiliates/apply` finishes what they started instead
 * of showing them a login page they will correctly believe they already used.
 *
 * `redirect` throws, so nothing after a failed check can run. That is why this
 * returns a non-nullable session: a caller cannot forget to check.
 */
export const requirePartner = cache(async (): Promise<PartnerSession> => {
  const user = await currentUser();
  if (!user) redirect("/affiliates/login");

  const partner = await partnerByUserId(user.id);
  if (!partner) redirect("/affiliates/apply");

  if (partner.status === "rejected" || partner.status === "suspended") {
    /* Not a redirect loop: `/affiliates/closed` is outside the dashboard and
       does not call this. They keep their login — an account we suspended in
       error has to be recoverable — but nothing behind it renders. */
    redirect("/affiliates/closed");
  }

  return { partner, userId: user.id };
});
