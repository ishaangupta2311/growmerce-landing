"use client";

import { useEffect, useState } from "react";
import Logo from "@/components/brand/Logo";
import { clsx } from "@/lib/clsx";
import { PRODUCTS } from "@/lib/products";
import { useScene } from "@/lib/scroll";

const LINKS = [
  { label: "Products", href: "#voiceshop" },
  { label: "Prices", href: "#pricing" },
  { label: "Service", href: "#service" },
  { label: "About us", href: "#about" },
];

export default function Nav() {
  const collected = useScene((s) => s.collected);

  // Section copy scrolls up past the nav, so once we leave the hero the bar
  // needs its own surface to stay legible over it.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-40 transition-colors duration-300",
        scrolled && "border-b border-ink/5 bg-steel-50/80 backdrop-blur-md",
      )}
    >
      <nav className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-6 md:px-12">
        <ul className="hidden items-center gap-8 text-[0.95rem] font-medium text-ink-soft md:flex">
          {LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="transition-colors duration-200 hover:text-brand"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-6 md:order-last">
          {/* Mirrors the 3D cart: the count ticks up as you scroll past each
              product, so the mechanic is legible even above the fold. */}
          <span
            className="flex items-center gap-2 text-sm font-medium tabular-nums text-ink-mute"
            aria-live="polite"
            aria-label={`${collected.length} of ${PRODUCTS.length} products in cart`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
              <path
                d="M2 3h2.2l2.4 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.55L20 7H5.2"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="9.5" cy="20" r="1.4" fill="currentColor" />
              <circle cx="17" cy="20" r="1.4" fill="currentColor" />
            </svg>
            {collected.length}/{PRODUCTS.length}
          </span>
          <Logo />
        </div>
      </nav>
    </header>
  );
}
