"use client";

import { useSection } from "@/lib/useSection";

export default function Hero() {
  const ref = useSection<HTMLElement>("hero");

  return (
    <section
      ref={ref}
      className="relative flex min-h-[160vh] flex-col items-center px-6"
    >
      {/* Upper two thirds are left clear — this is where the hand descends onto
          the trolley in the WebGL layer behind. */}
      <div className="h-[72vh] shrink-0" aria-hidden />

      <div className="relative z-20 mx-auto max-w-2xl text-center">
        <h1 className="text-balance-tight text-[1.6rem] font-medium leading-[1.5] text-ink sm:text-[1.8rem]">
          Every part of your store, thinking for itself.
        </h1>

        <p className="mt-5 text-balance-tight text-base leading-[1.75] text-ink-soft sm:text-[1.05rem]">
          Growmerce builds AI products that run the unglamorous half of ecommerce
          — search, merchandising, restocking, conversion — so your catalogue
          keeps working long after you have closed the laptop.
        </p>

        <a
          href="#voiceshop"
          className="mt-9 inline-flex h-14 items-center justify-center rounded-xl bg-brand px-14 text-base font-semibold text-white shadow-[0_10px_30px_-12px_rgba(239,108,37,0.8)] transition-transform duration-300 ease-out-expo hover:-translate-y-0.5 hover:bg-[#e0601c]"
        >
          Book a demo
        </a>
      </div>

      <div className="relative z-20 mt-auto flex flex-col items-center gap-3 pb-16 text-xs uppercase tracking-[0.22em] text-ink-mute">
        <span>Scroll to fill the cart</span>
        <span className="h-10 w-px bg-gradient-to-b from-ink-mute/60 to-transparent" />
      </div>
    </section>
  );
}
