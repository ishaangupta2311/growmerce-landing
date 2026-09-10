import type { Metadata } from "next";

import SignInForm from "@/components/affiliate/forms/SignInForm";

import AuthShell from "../AuthShell";

export const metadata: Metadata = { title: "Sign in" };

/**
 * `searchParams` is a promise in Next.js 16 — awaited, not destructured.
 *
 * Two things arrive on it. `next` is put there by `src/proxy.ts` when it turns
 * somebody away from a dashboard link, and is validated again in the sign-in
 * action. `expired` is set by the auth callback when an emailed link has been
 * used or has timed out, which otherwise looks to the person like clicking the
 * link did nothing at all.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; expired?: string }>;
}) {
  const { next, expired } = await searchParams;

  return (
    <AuthShell
      title="Sign in"
      lede="Your referrals, what they have earned, and when it lands."
      notice={
        expired
          ? "That link has expired or had already been used. Sign in below, or send yourself a new one."
          : undefined
      }
    >
      <SignInForm next={next} />
    </AuthShell>
  );
}
