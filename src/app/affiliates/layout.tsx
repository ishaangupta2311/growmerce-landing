import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

/**
 * The chrome every affiliate page shares.
 *
 * Deliberately not the marketing `Navbar`. That header carries four mega-menus
 * about Growsearch, and a partner reading their earnings has not come here to
 * be sold the product they already sell. What they need is a way back to the
 * public site and nothing competing with it.
 */

/**
 * Nothing under `/affiliates` can be prerendered: every page reads the session
 * cookie, including the public programme page, which shows "open my dashboard"
 * to a partner who is already signed in.
 *
 * Declared here rather than left to Next.js to infer. The inference works — the
 * first `cookies()` call opts a route out of the static pass — but it means the
 * build's behaviour depends on the order of two statements inside
 * `supabaseServer()`, and the failure if that order ever changes is a build
 * error about a missing Supabase key on a machine that was never going to have
 * one. Saying it out loud costs a line.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Affiliate program",
    template: "%s · Growmerce affiliates",
  },
  description:
    "Earn on every store you bring to Growmerce. Recurring commission for agencies, a one-off share for creators.",
  /* Nothing under here belongs in an index: half of it is behind a login and
     the other half would rank against the marketing pages for our own name. */
  robots: { index: false, follow: true },
};

export default function AffiliatesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-white font-bricolage">
      <header className="border-b border-line bg-cream">
        <div className="mx-auto flex h-[72px] w-full max-w-[1180px] items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="Growmerce home" className="shrink-0">
            <Image
              src="/brand/logo.svg"
              alt="Growmerce"
              width={310}
              height={67}
              priority
              className="h-9 w-auto"
            />
          </Link>
          <p className="font-poppins text-[14px] font-bold tracking-[0.04em] text-brand uppercase">
            Affiliates
          </p>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line bg-cream">
        <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-3 px-5 py-6 text-[14px] text-body-mute sm:px-8">
          <p>© {new Date().getFullYear()} Growmerce</p>
          <nav className="flex gap-5">
            <Link href="/terms" className="hover:text-brand">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-brand">
              Privacy
            </Link>
            <Link href="/help" className="hover:text-brand">
              Help
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
