import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/affiliate/admin";
import AdminNav from "@/components/affiliate/admin/AdminNav";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Affiliate admin" },
  robots: { index: false, follow: false },
};

/**
 * The admin shell.
 *
 * `requireAdmin()` is called here *and* in every page beneath it. A layout is
 * not a security boundary in the App Router — it does not re-render on a
 * client-side navigation between its children — so a check that lived only here
 * would be skipped exactly when somebody moves from one admin tab to the next.
 * React's `cache` collapses the repeats into one verified session lookup per
 * request, so the duplication costs nothing but a line per page.
 *
 * The signed-in address is in the header because these pages are where money
 * gets marked as paid, and "who was logged in when this happened" is the first
 * question anybody asks afterwards. We have no audit trail yet; the least we
 * can do is make the answer visible while they work.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4 pt-10">
        <div>
          <p className="font-poppins text-[13px] font-bold tracking-[0.04em] text-body-mute uppercase">
            Affiliate program
          </p>
          <h1 className="mt-1.5 text-[clamp(1.6rem,3.6vw,2.2rem)] leading-tight font-bold">
            Admin
          </h1>
        </div>

        <div className="text-right">
          <p className="text-[14px] text-body-mute">
            Signed in as <span className="font-bold text-charcoal">{admin.email}</span>
          </p>
          <Link
            href="/affiliates/dashboard"
            className="mt-1 inline-block text-[14px] font-bold text-brand underline"
          >
            Partner dashboard
          </Link>
        </div>
      </header>

      <div className="mt-8 border-b border-line">
        <AdminNav />
      </div>

      <div className="py-8">{children}</div>
    </div>
  );
}
