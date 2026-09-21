"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  ExternalLink,
  FileText,
  FolderOpen,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Tags,
  X,
} from "lucide-react";
import { logout } from "@/app/admin/_actions/auth";
import { clsx } from "@/lib/clsx";
import { ToastProvider } from "./overlay";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/blogs", label: "Blogs", icon: FileText },
  { href: "/admin/categories", label: "Categories", icon: FolderOpen },
  { href: "/admin/tags", label: "Tags", icon: Tags },
  { href: "/admin/media", label: "Media", icon: Images },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function initials(name: string, email: string): string {
  const source = name.trim() || email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "A";
}

function LogoutButton({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <form action={logout}>
      <button
        type="submit"
        className={clsx(
          "inline-flex items-center gap-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-brand",
          className,
        )}
      >
        <LogOut aria-hidden className="size-4" />
        <span className={compact ? "sr-only sm:not-sr-only" : undefined}>Log out</span>
      </button>
    </form>
  );
}

export default function AdminShell({
  admin,
  children,
}: {
  admin: { name: string; email: string };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  /* Close the drawer on navigation. */
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-zinc-800 px-5">
        <span className="grid size-8 place-items-center rounded-lg bg-brand text-sm font-black text-white">G</span>
        <div className="leading-tight">
          <p className="text-sm font-extrabold text-white">Growmerce</p>
          <p className="text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">Blog admin</p>
        </div>
      </div>

      <nav aria-label="Admin" className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                active ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon aria-hidden className={clsx("size-[18px]", active && "text-brand")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-zinc-800 p-3">
        <a
          href="/blog"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-zinc-400 hover:bg-white/5 hover:text-white"
        >
          <ExternalLink aria-hidden className="size-[18px]" />
          View blog
        </a>
        <LogoutButton className="w-full px-3 py-2 text-zinc-400 hover:bg-white/5 hover:text-white [&>svg]:size-[18px] gap-3" />
      </div>
    </div>
  );

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-zinc-50 font-sans text-zinc-900">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-zinc-950 lg:block">{sidebar}</aside>

        {/* Mobile drawer */}
        <div className={clsx("fixed inset-0 z-40 lg:hidden", open ? "visible" : "invisible")} aria-hidden={!open}>
          <div
            className={clsx("absolute inset-0 bg-zinc-950/50 transition-opacity", open ? "opacity-100" : "opacity-0")}
            onClick={() => setOpen(false)}
          />
          <aside
            className={clsx(
              "absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-zinc-950 shadow-2xl transition-transform duration-200",
              open ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-3 rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
            {sidebar}
          </aside>
        </div>

        <div className="lg:pl-64">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-zinc-200 bg-white/90 px-4 backdrop-blur sm:px-6">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="-ml-1 rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 lg:hidden"
              aria-label="Open menu"
              aria-expanded={open}
            >
              <Menu className="size-5" />
            </button>
            <div className="flex-1" />
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden min-w-0 text-right sm:block">
                <p className="truncate text-sm font-bold text-zinc-900">{admin.name || "Admin"}</p>
                <p className="truncate text-xs text-zinc-500">{admin.email}</p>
              </div>
              <span
                aria-hidden
                className="grid size-9 shrink-0 place-items-center rounded-full bg-brand/10 text-xs font-extrabold text-brand"
              >
                {initials(admin.name, admin.email)}
              </span>
              <LogoutButton
                compact
                className="h-9 border border-zinc-200 bg-white px-3 text-zinc-700 shadow-xs hover:bg-zinc-50"
              />
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
