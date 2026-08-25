"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import HeaderMegaMenu, { type HeaderMegaMenuVariant } from "./HeaderMegaMenu";

type MenuItem = { label: string; href: string; note?: string };
type NavEntry = { label: string; href?: string; items?: MenuItem[] };

/* Figma draws Platform / Resources / Why us with carets; they resolve to the
   real routes below. Pricing is a plain link. */
const NAV: NavEntry[] = [
  {
    label: "Platform",
    items: [
      { label: "Growsearch", href: "/growsearch", note: "Storefront search that never dead-ends" },
      { label: "All features", href: "/growsearch/features", note: "Everything Growsearch does" },
      { label: "Solutions", href: "/solutions", note: "The revenue your search bar is leaking" },
    ],
  },
  {
    label: "Resources",
    items: [
      { label: "What is Growmerce", href: "/about" },
      { label: "FAQ", href: "/#faq" },
      { label: "Help center", href: "#" },
    ],
  },
  {
    label: "Why us",
    items: [
      { label: "How we work", href: "/about" },
      { label: "Same catalog, different outcome", href: "/solutions" },
    ],
  },
  { label: "Pricing", href: "/pricing" },
];

function Caret({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={`transition-transform duration-200 ${open ? "" : "rotate-180"}`}
    >
      <path d="m5 14 7-7 7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(null);
        setMobile(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  // Hover with a short close delay so the pointer can travel into the panel.
  const hoverOpen = (label: string) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpen(label);
  };
  const keepOpen = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  };
  const hoverClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      if (!navRef.current?.contains(document.activeElement)) setOpen(null);
    }, 140);
  };

  const megaMenuVariant: HeaderMegaMenuVariant | null =
    open === "Platform"
      ? pathname.startsWith("/growsearch")
        ? "growsearch"
        : "platform"
      : open === "Resources"
        ? "resources"
        : open === "Why us"
          ? "why-us"
          : null;

  return (
    <header className="sticky top-0 z-50 bg-cream/95 font-bricolage shadow-[0_1px_0_rgba(23,23,23,0.07)] backdrop-blur-md">
      <div
        ref={navRef}
        className="relative mx-auto flex h-[84px] w-full max-w-[1440px] items-center justify-between px-5 sm:px-8"
      >
        <Link href="/" aria-label="Growmerce home" className="shrink-0">
          <Image
            src="/brand/logo.svg"
            alt="Growmerce"
            width={305}
            height={66}
            priority
            className="h-10 w-auto sm:h-11"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 font-poppins text-[17px] font-medium lg:flex">
          {NAV.map((entry) =>
            entry.items ? (
              <div
                key={entry.label}
                className="relative"
                onMouseEnter={() => hoverOpen(entry.label)}
                onMouseLeave={hoverClose}
              >
                <button
                  type="button"
                  aria-expanded={open === entry.label}
                  aria-haspopup="true"
                  aria-controls="header-mega-menu"
                  onClick={() => setOpen(entry.label)}
                  onFocus={() => hoverOpen(entry.label)}
                  className="flex items-center gap-1.5 rounded-md py-2 transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {entry.label}
                  <Caret open={open === entry.label} />
                </button>

              </div>
            ) : (
              <Link
                key={entry.label}
                href={entry.href!}
                className="rounded-md py-2 transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {entry.label}
              </Link>
            ),
          )}
        </nav>

        {/* Keep one shell mounted while moving between mega-menu triggers.
            Only its content variant changes, so the entrance motion does not replay. */}
        {megaMenuVariant ? (
          <HeaderMegaMenu
            variant={megaMenuVariant}
            onNavigate={() => setOpen(null)}
            onMouseEnter={keepOpen}
            onMouseLeave={hoverClose}
          />
        ) : null}

        <div className="flex shrink-0 items-center gap-2.5">
          <Link
            href="#demo"
            className="hidden items-center justify-center rounded-[10px] bg-brand px-5 py-2 font-poppins text-[15px] font-bold text-white shadow-[0_10px_24px_-14px_rgba(255,90,31,0.9)] transition-transform duration-200 hover:-translate-y-0.5 sm:inline-flex"
          >
            See demo
          </Link>
          <Link
            href="#login"
            className="hidden items-center justify-center rounded-[10px] border-2 border-brand bg-white px-5 py-2 font-poppins text-[15px] font-bold text-brand transition-[background-color,color] duration-200 hover:bg-brand hover:text-white sm:inline-flex"
          >
            Login
          </Link>
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={mobile}
            onClick={() => setMobile(!mobile)}
            className="grid size-11 place-items-center rounded-full border border-charcoal/20 lg:hidden"
          >
            <span className="sr-only">Menu</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              {mobile ? (
                <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      {mobile ? (
        <div className="border-t border-line bg-white px-5 pb-6 lg:hidden">
          {NAV.map((entry) => (
            <div key={entry.label} className="border-b border-line py-3 last:border-0">
              {entry.href ? (
                <Link
                  href={entry.href}
                  onClick={() => setMobile(false)}
                  className="block font-poppins text-[17px] font-medium"
                >
                  {entry.label}
                </Link>
              ) : (
                <>
                  <p className="font-poppins text-[13px] font-semibold tracking-[0.12em] text-muted uppercase">
                    {entry.label}
                  </p>
                  <div className="mt-1.5 space-y-1.5">
                    {entry.items!.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMobile(false)}
                        className="block text-[16px] font-medium text-charcoal"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
          <div className="mt-5 flex gap-3">
            <Link href="#demo" onClick={() => setMobile(false)} className="flex-1 rounded-[10px] bg-brand py-2.5 text-center font-poppins text-[15px] font-bold text-white">
              See demo
            </Link>
            <Link href="#login" onClick={() => setMobile(false)} className="flex-1 rounded-[10px] border-2 border-brand bg-white py-2.5 text-center font-poppins text-[15px] font-bold text-brand">
              Login
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
