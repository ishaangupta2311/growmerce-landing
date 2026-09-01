"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import HeaderMegaMenu, { type HeaderMegaMenuVariant } from "./HeaderMegaMenu";
import { GROWMERCE_HOME, GROWSEARCH_DEMO, GROWSEARCH_FEATURES, GROWSEARCH_HOME } from "@/lib/site-urls";

type MenuItem = { label: string; href: string; note?: string };
type NavEntry = { label: string; href?: string; items?: MenuItem[] };

/* Figma draws Platform / Resources / Why us with carets; they resolve to the
   real routes below. Pricing is a plain link. */
const NAV: NavEntry[] = [
  {
    label: "Platform",
    items: [
      { label: "Growsearch", href: GROWSEARCH_HOME, note: "Storefront search that never dead-ends" },
      { label: "All features", href: GROWSEARCH_FEATURES, note: "Everything Growsearch does" },
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

/* Row affordance in the mobile sheet: says "this navigates" without a label. */
function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-brand/60">
      <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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

export default function Navbar({
  scope,
}: {
  scope?: "growmerce" | "growsearch";
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);

  /* The sheet covers the viewport, so the page behind it must not scroll —
     otherwise closing it lands the reader somewhere they never chose. */
  useEffect(() => {
    if (!mobile) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobile]);

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

  const isGrowsearchScope =
    scope === "growsearch" ||
    (scope !== "growmerce" && pathname.startsWith("/growsearch"));

  const megaMenuVariant: HeaderMegaMenuVariant | null =
    open === "Platform"
      ? isGrowsearchScope
        ? "growsearch"
        : "platform"
      : open === "Resources"
        ? "resources"
        : open === "Why us"
          ? "why-us"
          : null;

  return (
    <header className="sticky top-0 z-50 bg-cream font-bricolage shadow-[0_1px_0_rgba(23,23,23,0.07)]">
      <div
        ref={navRef}
        className="relative mx-auto flex h-[84px] w-full max-w-[1440px] items-center justify-between px-5 sm:px-8"
      >
        <Link href={GROWMERCE_HOME} aria-label="Growmerce home" className="shrink-0">
          <Image
            src="/brand/logo.svg"
            alt="Growmerce"
            width={310}
            height={67}
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
            href={GROWSEARCH_DEMO}
            className="hidden items-center justify-center rounded-[10px] bg-brand px-5 py-2 font-poppins text-[15px] font-bold text-white shadow-[0_10px_24px_-14px_rgba(255,90,31,0.9)] transition-transform duration-200 hover-lift sm:inline-flex"
          >
            See demo
          </Link>
          <Link
            href="#login"
            className="hidden items-center justify-center rounded-[10px] border-2 border-brand bg-white px-[18px] py-[6px] font-poppins text-[15px] font-bold text-brand transition-[background-color,color] duration-200 hover:bg-brand hover:text-white sm:inline-flex"
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

      {/* Mobile sheet
          ------------------------------------------------------------------
          A full-height surface rather than a dropdown: the old panel ended
          partway down the page with the hero showing underneath, which read
          as unfinished. The header stays put above it and keeps the close
          control, so this starts at 84px — the header's height, fixed at
          every phone width.

          The groups are cards on cream, which is how the rest of the site
          presents a list, and the eyebrows are brand orange rather than grey
          so the three sections separate without needing rules between every
          row. */}
      {mobile ? (
        <div className="fixed inset-x-0 top-[84px] bottom-0 z-40 overflow-y-auto overscroll-contain bg-cream lg:hidden">
          <div className="flex min-h-full flex-col px-5 pt-5">
            <nav aria-label="Main" className="flex-1 space-y-6 pb-6">
              {NAV.map((entry) =>
                entry.href ? (
                  <Link
                    key={entry.label}
                    href={entry.href}
                    onClick={() => setMobile(false)}
                    className="flex items-center justify-between gap-3 rounded-[18px] bg-white px-4 py-4 font-poppins text-[17px] font-semibold text-charcoal shadow-[0_10px_24px_-20px_rgba(23,23,23,0.5)]"
                  >
                    {entry.label}
                    <Chevron />
                  </Link>
                ) : (
                  <div key={entry.label}>
                    <p className="px-1 pb-2 font-poppins text-[11px] font-bold tracking-[0.18em] text-brand uppercase">
                      {entry.label}
                    </p>
                    <div className="overflow-hidden rounded-[18px] bg-white shadow-[0_10px_24px_-20px_rgba(23,23,23,0.5)]">
                      {entry.items!.map((item, i) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setMobile(false)}
                          className={`flex items-center justify-between gap-3 px-4 py-3.5 ${i ? "border-t border-line" : ""}`}
                        >
                          <span className="min-w-0">
                            <span className="block font-poppins text-[17px] font-semibold text-charcoal">
                              {item.label}
                            </span>
                            {item.note ? (
                              <span className="mt-0.5 block text-[13px] leading-snug text-body-mute">
                                {item.note}
                              </span>
                            ) : null}
                          </span>
                          <Chevron />
                        </Link>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </nav>

            {/* Full width and stacked: the sheet is the whole screen here, so
                a pair of half-width buttons would leave the primary action
                smaller than every row above it. Pinned to the foot, because
                the list is taller than any phone and the primary action
                should not be something you have to scroll to find. */}
            <div className="sticky bottom-0 -mx-5 grid gap-3 border-t border-brand/10 bg-cream px-5 pt-4 pb-6">
              <Link
                href={GROWSEARCH_DEMO}
                onClick={() => setMobile(false)}
                className="cta-primary w-full"
              >
                See demo
              </Link>
              <Link
                href="#login"
                onClick={() => setMobile(false)}
                className="cta-secondary w-full"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
