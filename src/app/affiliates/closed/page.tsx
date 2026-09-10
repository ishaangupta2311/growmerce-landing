import type { Metadata } from "next";
import Link from "next/link";

import SignOutButton from "@/components/affiliate/forms/SignOutButton";

export const metadata: Metadata = { title: "Account unavailable" };

/**
 * Where `requirePartner()` sends a rejected or suspended partner.
 *
 * Outside the dashboard, and it does not call `requirePartner()` itself — which
 * is the only reason this is not a redirect loop.
 *
 * It says as little as it can while still being honest. Whichever of the two
 * states somebody is in, the action is the same: write to us. Spelling out
 * which one, in a page anyone can reach by signing in, is a detail we would
 * rather deliver in a reply than on a screen.
 */
export default function ClosedPage() {
  return (
    <div className="mx-auto w-full max-w-[560px] px-5 py-24 text-center">
      <h1 className="text-[clamp(1.6rem,4vw,2.2rem)] leading-tight font-bold">
        This account is not active.
      </h1>
      <p className="mt-4 text-[16px] leading-relaxed text-body-mute">
        Your affiliate account is closed for now, so the dashboard is not
        available. If that is a surprise, write to us — it is a short
        conversation and we would rather have it than not.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/help" className="cta-primary">
          Contact us
        </Link>
      </div>

      <div className="mt-8 flex justify-center">
        <SignOutButton />
      </div>
    </div>
  );
}
