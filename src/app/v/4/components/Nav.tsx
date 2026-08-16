"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "../nightmarket.module.css";
import { focusRing, Lightbox, Sparkle } from "./bits";

const LINKS = [
  { label: "Products", href: "#high-street" },
  { label: "Why us", href: "#why" },
  { label: "About", href: "#shopkeeper" },
];

/* The illuminated ticker over the street, the way a late shop puts its hours
   in the window. */
const NOTICES = [
  "Open late for early access",
  "First shop lit: Growsearch",
  "Built in Delhi, serving global ecommerce",
  "Founder answers the demo calls",
  "Install tonight — no migration",
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50">
      <a
        href="#main"
        className={`${styles.display} ${focusRing} sr-only rounded-full bg-[#ff5c1a] px-5 py-2.5 font-bold text-[#20140c] focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-[60]`}
      >
        Skip to content
      </a>

      <div className="overflow-hidden border-b border-[#ffc46b]/12 bg-[#120b06] py-1.5 text-[#e3cab4]">
        <div className={`${styles.ribbonTrack} flex w-max`}>
          {[0, 1].map((copy) => (
            <ul
              key={copy}
              aria-hidden={copy === 1}
              className="flex shrink-0 items-center"
            >
              {NOTICES.map((notice) => (
                <li
                  key={notice}
                  className="flex items-center gap-3 px-5 text-[12px] font-semibold tracking-[0.12em] whitespace-nowrap uppercase"
                >
                  <Sparkle className="size-2.5 text-[#ffc46b]" />
                  {notice}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      <div className="border-b border-[#ffc46b]/12 bg-[#1a110a]/88 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] w-full max-w-[1280px] items-center justify-between gap-4 px-5 sm:px-8">
          <Link
            href="/v/4"
            aria-label="Growmerce home"
            className={`${focusRing} shrink-0 rounded-[14px]`}
          >
            <Lightbox priority />
          </Link>

          <nav
            aria-label="Primary"
            className={`${styles.display} hidden items-center gap-9 text-[17px] font-semibold text-[#fff2e4] md:flex`}
          >
            {LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`${focusRing} relative rounded-md py-1 transition-colors duration-200 hover:text-[#ffc46b] after:absolute after:-bottom-0.5 after:left-0 after:h-[3px] after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-[#ff8a3c] after:shadow-[0_0_10px_rgba(255,138,60,0.9)] after:transition-transform after:duration-300 hover:after:scale-x-100`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2.5">
            <Link
              href="#early-access"
              className={`${styles.springy} ${styles.display} ${focusRing} hidden rounded-full bg-[#ff5c1a] px-5 py-2.5 text-[15px] font-bold text-[#20140c] shadow-[0_0_24px_-4px_rgba(255,92,26,0.85)] hover:bg-[#ff7a33] sm:inline-flex`}
            >
              Get early access
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="v4-mobile-menu"
              className={`${focusRing} ${styles.tubeAmber} inline-flex size-10 items-center justify-center rounded-full text-[#ffc46b] md:hidden`}
            >
              <span className="sr-only">
                {open ? "Close menu" : "Open menu"}
              </span>
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                aria-hidden
              >
                {open ? (
                  <>
                    <path d="m6 6 12 12" />
                    <path d="m18 6-12 12" />
                  </>
                ) : (
                  <>
                    <path d="M4 8h16" />
                    <path d="M4 16h16" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {open ? (
          <div
            id="v4-mobile-menu"
            className="border-t border-[#ffc46b]/12 bg-[#1a110a] px-5 pt-3 pb-5 md:hidden"
          >
            <ul
              className={`${styles.display} space-y-1 text-[19px] font-bold text-[#fff2e4]`}
            >
              {LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`${focusRing} block rounded-xl px-3 py-2.5 hover:bg-[#33231a] hover:text-[#ffc46b]`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="#early-access"
              onClick={() => setOpen(false)}
              className={`${styles.display} ${focusRing} mt-3 flex items-center justify-center rounded-full bg-[#ff5c1a] px-5 py-3 text-[16px] font-bold text-[#20140c]`}
            >
              Get early access
            </Link>
          </div>
        ) : null}
      </div>
    </header>
  );
}
