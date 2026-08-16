"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "../bazaar.module.css";
import { focusRing, Sparkle } from "./bits";

const LINKS = [
  { label: "The shelf", href: "#shelf" },
  { label: "Why us", href: "#why" },
  { label: "House rules", href: "#house-rules" },
  { label: "About", href: "#founder" },
];

/* Shipping notices printed along the top of the carton. */
const NOTICES = [
  "Open for early access",
  "In stock: Growsearch",
  "Packed in Delhi · shipped worldwide",
  "The founder answers the demo calls",
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

  const notices = (
    <ul aria-hidden className="flex shrink-0 items-center">
      {NOTICES.map((n) => (
        <li
          key={n}
          className={`${styles.mono} flex items-center gap-3 px-5 text-[11.5px] font-bold tracking-[0.18em] whitespace-nowrap uppercase`}
        >
          <Sparkle className="size-2.5 text-[#ffd66e]" />
          {n}
        </li>
      ))}
    </ul>
  );

  return (
    <header className="sticky top-0 z-50">
      <a
        href="#main"
        className={`${styles.display} ${focusRing} sr-only rounded-[12px] border-[3px] border-[#2b1c14] bg-[#ffd66e] px-5 py-2.5 font-extrabold text-[#2b1c14] focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-[60]`}
      >
        Skip to content
      </a>

      {/* Carton stencil strip. */}
      <div className="overflow-hidden border-b-[3px] border-[#2b1c14] bg-[#2b1c14] py-1.5 text-[#ffe8df]">
        <div className="flex w-max animate-marquee">
          {notices}
          {notices}
        </div>
      </div>

      <div className="border-b-[3px] border-[#2b1c14] bg-[#fff6ee]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[70px] w-full max-w-[1280px] items-center justify-between gap-4 px-5 sm:px-8">
          <Link
            href="/v/5"
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
            className={`${styles.display} hidden items-center gap-7 text-[16.5px] font-bold lg:flex`}
          >
            {LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`${focusRing} relative rounded-md px-1 py-1 transition-colors duration-200 before:absolute before:inset-x-0 before:bottom-0.5 before:-z-10 before:h-[9px] before:origin-left before:scale-x-0 before:-rotate-[0.8deg] before:bg-[#ffd66e] before:transition-transform before:duration-300 hover:before:scale-x-100`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2.5">
            <Link
              href="#early-access"
              className={`${styles.springy} ${styles.springySm} ${styles.display} ${focusRing} hidden rounded-[12px] border-[3px] border-[#2b1c14] bg-[#d1400a] px-5 py-2 text-[15px] font-extrabold text-white sm:inline-flex`}
            >
              Get early access
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="v5-mobile-menu"
              className={`${focusRing} inline-flex size-10 items-center justify-center rounded-[11px] border-[3px] border-[#2b1c14] bg-[#ffd66e] text-[#2b1c14] shadow-[3px_4px_0_rgba(43,28,20,0.9)] lg:hidden`}
            >
              <span className="sr-only">
                {open ? "Close menu" : "Open menu"}
              </span>
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
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
            id="v5-mobile-menu"
            className="border-t-[3px] border-[#2b1c14] bg-[#fff6ee] px-5 pt-3 pb-5 lg:hidden"
          >
            <ul className={`${styles.display} space-y-1 text-[19px] font-bold`}>
              {LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`${focusRing} block rounded-[12px] px-3 py-2.5 hover:bg-[#ffd66e]`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="#early-access"
              onClick={() => setOpen(false)}
              className={`${styles.springy} ${styles.springySm} ${styles.display} ${focusRing} mt-3 flex items-center justify-center rounded-[12px] border-[3px] border-[#2b1c14] bg-[#d1400a] px-5 py-3 text-[16px] font-extrabold text-white`}
            >
              Get early access
            </Link>
          </div>
        ) : null}
      </div>
    </header>
  );
}
