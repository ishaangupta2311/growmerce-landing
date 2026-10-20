"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { clsx } from "@/lib/clsx";

const TABS = [
  { href: "/admin/team", label: "Members" },
  { href: "/admin/team/roles", label: "Roles" },
  { href: "/admin/team/activity", label: "Activity" },
];

/** Members, Roles and Activity: the three pages of the Team tab. */
export default function TeamTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Team" className="mb-5 flex gap-5 border-b border-zinc-200">
      {TABS.map(({ href, label }) => {
        const active =
          href === "/admin/team" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "-mb-px border-b-2 py-2.5 text-sm font-semibold transition-colors",
              active ? "border-brand text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-900",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
