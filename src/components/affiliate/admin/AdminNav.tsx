"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The admin tabs.
 *
 * Ordered by how often they are opened rather than by hierarchy: the queue
 * first, then the people in it, then the money, then the log you only reach
 * for when something is wrong.
 *
 * A Client Component for the same reason `DashboardNav` is — the current tab
 * comes from the path, and `usePathname` beats threading it through five pages.
 */
const TABS = [
  { href: "/affiliates/admin", label: "Overview" },
  { href: "/affiliates/admin/partners", label: "Partners" },
  { href: "/affiliates/admin/payouts", label: "Payouts" },
  { href: "/affiliates/admin/events", label: "Ingest log" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="-mb-px flex gap-1 overflow-x-auto">
      {TABS.map((tab) => {
        const active =
          tab.href === "/affiliates/admin"
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
