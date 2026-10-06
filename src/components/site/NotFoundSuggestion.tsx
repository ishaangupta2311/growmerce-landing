"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { closestPage } from "@/lib/site-pages";

/**
 * The one part of the 404 page that knows which address was asked for.
 *
 * A client component for that reason alone: `not-found.tsx` is given no
 * params and no path. The 404 page is also prerendered once and served for
 * every missing address, so the HTML cannot carry a guess; the address is read
 * from the browser after hydration, and the server's answer is "no guess",
 * which is what the buttons fall back to.
 */
const subscribe = () => () => {};

export default function NotFoundSuggestion() {
  const pathname = useSyncExternalStore(
    subscribe,
    () => window.location.pathname,
    () => null,
  );
  const guess = pathname ? closestPage(pathname) : null;

  return (
    <>
      {guess && (
        <p className="mt-6 text-[clamp(1.0625rem,1.6vw,1.25rem)] leading-relaxed text-charcoal">
          Did you mean{" "}
          <Link href={guess.path} className="font-bold text-brand underline underline-offset-4">
            {guess.label}
          </Link>
          ?
        </p>
      )}

      <div className="mt-9 flex flex-wrap justify-center gap-4 [&>a]:max-[430px]:w-full">
        <Link href={guess?.path ?? "/"} className="cta-primary">
          {guess ? `Go to ${guess.label}` : "Back to the home page"}
        </Link>
        <Link href={guess ? "/" : "/help"} className="cta-secondary">
          {guess ? "Home page" : "Help centre"}
        </Link>
      </div>
    </>
  );
}
