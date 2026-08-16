"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "../shopfront.module.css";
import { focusRing, Sparkle } from "./bits";

const LINKS = [
  { label: "Products", href: "#high-street" },
  { label: "Why us", href: "#why" },
  { label: "About", href: "#shopkeeper" },
];

/* Shop notices that scroll along the top ribbon, the way a corner store puts
   its opening hours in the window. */
const NOTICES = [
  "Open for early access",
  "First shop: Growsearch",
  "Built in Delhi, serving global ecommerce",
  "Founder answers the demo calls",
  "Install today — no migration",
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
        className={`${styles.display} ${focusRing} sr-only rounded-full bg-[#171717] px-5 py-2.5 font-bold text-white focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-[60]`}
      >
        Skip to content
      </a>

      {/* Ribbon of shop notices. */}
      <div className="overflow-hidden bg-[#171717] py-1.5 text-white">
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
                  <Sparkle className="size-2.5 text-[#ff5a1f]" />
                  {notice}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      <div className="border-b border-[#171717]/8 bg-[#fff4ee]/92 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] w-full max-w-[1280px] items-center justify-between gap-4 px-5 sm:px-8">
          <Link
            href="/v/3"
            aria-label="Growmerce home"
            className={`${focusRing} shrink-0 rounded-lg`}
          >
            <Image
              src="/brand/logo.svg"
              alt="Growmerce"
              width={305}
              height={66}
              priority
              className="h-9 w-auto sm:h-10"
            />
          </Link>

          <nav
            aria-label="Primary"
            className={`${styles.display} hidden items-center gap-9 text-[17px] font-semibold md:flex`}
          >
            {LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`${focusRing} relative rounded-md py-1 transition-colors duration-200 hover:text-[#e04a10] after:absolute after:-bottom-0.5 after:left-0 after:h-[3px] after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-[#ff5a1f] after:transition-transform after:duration-300 hover:after:scale-x-100`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2.5">
            <Link
              href="#early-access"
              className={`${styles.springy} ${styles.display} ${focusRing} hidden rounded-full bg-[#ff5a1f] px-5 py-2.5 text-[15px] font-bold text-white shadow-[0_10px_22px_-12px_rgba(255,90,31,0.95)] hover:bg-[#e04a10] sm:inline-flex`}
            >
              Get early access
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="v3-mobile-menu"
              className={`${focusRing} inline-flex size-10 items-center justify-center rounded-full border-2 border-[#171717]/85 text-[#171717] md:hidden`}
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
            id="v3-mobile-menu"
            className="border-t border-[#171717]/8 bg-[#fff4ee] px-5 pt-3 pb-5 md:hidden"
          >
            <ul className={`${styles.display} space-y-1 text-[19px] font-bold`}>
              {LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`${focusRing} block rounded-xl px-3 py-2.5 hover:bg-[#ffe4d6]`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="#early-access"
              onClick={() => setOpen(false)}
              className={`${styles.display} ${focusRing} mt-3 flex items-center justify-center rounded-full bg-[#ff5a1f] px-5 py-3 text-[16px] font-bold text-white`}
            >
              Get early access
            </Link>
          </div>
        ) : null}
      </div>
    </header>
  );
}
