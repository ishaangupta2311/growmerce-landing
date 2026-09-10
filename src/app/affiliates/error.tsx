"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * What the affiliate surface shows when something throws.
 *
 * It exists because `src/lib/affiliate/store.ts` deliberately does *not* do
 * what the rest of this codebase does. Everywhere else a database failure is
 * swallowed and the page renders anyway; here it is allowed to reach this
 * boundary, because the alternative is a dashboard that reports a balance of
 * zero when it means it could not reach the database. A partner who sees this
 * page knows to try again. A partner who sees $0 opens a support ticket about
 * their missing money.
 *
 * The message never includes `error.message`. These errors carry query text and
 * occasionally parameters, and the parameters are somebody's payout details.
 */
export default function AffiliateError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[affiliate] page failed", error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-[560px] px-5 py-24 text-center">
      <h1 className="text-[clamp(1.6rem,4vw,2.2rem)] leading-tight font-bold">
        We could not load your dashboard.
      </h1>
      <p className="mt-4 text-[16px] leading-relaxed text-body-mute">
        Nothing has been lost — your referrals and your balance are safe. This is
        us failing to read them, and it is usually over in a moment.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="cta-primary">
          Try again
        </button>
        <Link href="/help" className="cta-secondary">
          Get help
        </Link>
      </div>

      {error.digest && (
        <p className="mt-8 text-[13px] text-muted">
          If you write to us, quote <code className="font-poppins">{error.digest}</code>.
        </p>
      )}
    </div>
  );
}
