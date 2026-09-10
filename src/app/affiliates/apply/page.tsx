import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { partnerByUserId } from "@/lib/affiliate/store";
import { currentUser } from "@/lib/supabase/server";
import ApplyForm from "@/components/affiliate/forms/ApplyForm";

import AuthShell from "../AuthShell";

export const metadata: Metadata = { title: "Finish your application" };

/**
 * The gap between having a login and having a partner account.
 *
 * Everybody passes through here exactly once. `signUp` creates only the
 * Supabase user — there is no confirmed identity to attach a partner record to
 * until the emailed link has been clicked — so this page is where the
 * application details, carried on the user's metadata since sign-up, become a
 * row with a commission rate and an affiliate code.
 *
 * Somebody who already has an account is sent to it rather than shown a form
 * that would fail on the unique index: this page is reachable from a bookmark,
 * and a returning partner following one should land on their dashboard.
 */
export default async function ApplyPage() {
  const user = await currentUser();
  if (!user) redirect("/affiliates/login");

  if (await partnerByUserId(user.id)) redirect("/affiliates/dashboard");

  /* Metadata is a free-form JSON blob on the auth user, so every field is
     `unknown` until proven otherwise. It only pre-fills a form the person is
     about to confirm, but a number where a name should be would still render
     as `[object Object]` in an input. */
  const meta = user.user_metadata ?? {};
  const string = (value: unknown) => (typeof value === "string" ? value : "");

  return (
    <AuthShell
      title="One more step"
      lede="This is what your account will be set up as. Change anything that is not right — after this, the way you are paid is only editable by us."
    >
      <ApplyForm
        defaults={{
          name: string(meta.affiliate_name) || string(meta.full_name),
          kind: meta.affiliate_kind === "influencer" ? "influencer" : "agency",
          company: string(meta.affiliate_company),
          website: string(meta.affiliate_website),
        }}
      />
    </AuthShell>
  );
}
