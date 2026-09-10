"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The dashboard's four tabs.
 *
 * A Client Component only because the current tab has to be derived from the
 * path, and `usePathname` is the cheapest correct way to know it — the
 * alternative is threading the pathname down from every page.
 *
 * `aria-current="page"` as well as the underline. The orange bar is the whole
 * signal otherwise, and it is exactly the signal a screen reader cannot see.
 */

const TABS = [
  { href: "/affiliates/dashboard", label: "Overview" },
  { href: "/affiliates/dashboard/sites", label: "Referred stores" },
  { href: "/affiliates/dashboard/earnings", label: "Earnings" },
  { href: "/affiliates/dashboard/payouts", label: "Payouts" },
  { href: "/affiliates/dashboard/settings", label: "Settings" },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Dashboard" className="-mb-px flex gap-1 overflow-x-auto">
      {TABS.map((tab) => {
        /* Exact match for the overview, prefix for the rest — otherwise the
           first tab stays lit on every page, since every path starts with it. */
        const active =
          tab.href === "/affiliates/dashboard"
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 border-b-2 px-4 py-3 font-poppins text-[15px] font-bold whitespace-nowrap transition-colors ${
              active
                ? "border-brand text-brand"
                : "border-transparent text-body-mute hover:border-line hover:text-charcoal"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
