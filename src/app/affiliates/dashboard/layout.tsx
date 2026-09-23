import Link from "next/link";

import { optionalAdmin } from "@/lib/admin/session";
import { describeTerms } from "@/lib/affiliate/commission";
import { requirePartner } from "@/lib/affiliate/session";
import DashboardNav from "@/components/affiliate/DashboardNav";
import { PartnerPill } from "@/components/affiliate/StatusPill";
import SignOutButton from "@/components/affiliate/forms/SignOutButton";

/**
 * The signed-in shell.
 *
 * `requirePartner()` is called here as well as in every page beneath it, and
 * the repetition is on purpose. A layout is *not* a security boundary in the
 * App Router: it does not re-render on every navigation between its children,
 * so a check that lives only here would be skipped on a client-side move from
 * one tab to the next. Calling it in both places costs nothing — React's
 * `cache` collapses them into one lookup per request — and means no page can
 * be added later that quietly forgets.
 *
 * The state banner is the other thing this layout owns. A partner awaiting
 * approval can see everything, and their commissions are recorded but never
 * clear; being told that up front is better than working it out from a balance
 * that will not move.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { partner } = await requirePartner();

  /* An admin who also has a partner account — which is how anybody tests this
     — otherwise has to remember a URL that is deliberately unlinked from
     everywhere else. Nothing is revealed to a non-admin: this returns null for
     them, and the address 404s. */
  const admin = await optionalAdmin();

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4 pt-10">
        <div>
          <p className="font-poppins text-[13px] font-bold tracking-[0.04em] text-body-mute uppercase">
            {partner.kind === "agency" ? "Agency partner" : "Creator partner"}
          </p>
          <h1 className="mt-1.5 text-[clamp(1.6rem,3.6vw,2.2rem)] leading-tight font-bold">
            {partner.company}
          </h1>
          <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-body-mute">
            {describeTerms(partner.kind, partner.commissionRateBps)}
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <PartnerPill status={partner.status} />
          {admin && (
            <Link
              href="/admin"
              className="font-poppins text-[14px] font-bold text-brand underline"
            >
              Admin
            </Link>
          )}
          <SignOutButton />
        </div>
      </header>

      {partner.status === "pending" && (
        <p
          role="status"
          className="mt-6 rounded-[12px] border border-brand/25 bg-cream px-5 py-4 text-[15px] leading-relaxed text-charcoal"
        >
          <strong className="font-bold">Your application is with us.</strong> Your
          code works already — share it and start referring. Commissions earned
          before we approve you are recorded and held; they begin clearing the
          moment your account is approved.
        </p>
      )}

      <div className="mt-8 border-b border-line">
        <DashboardNav />
      </div>

      <div className="py-8">{children}</div>
    </div>
  );
}
