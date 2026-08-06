"use client";

import { useSection } from "@/lib/useSection";

export default function Hero() {
  const ref = useSection<HTMLElement>("hero");

  return (
    <section ref={ref} className="relative min-h-[185vh]">
      {/*
        The copy is pinned to the viewport for the whole section rather than
        scrolling through it. The trolley lives in a fixed WebGL layer, so any
        copy that scrolls will eventually cross it — pinning gives the two a
        permanent lane each: cart above, copy below.
      */}
      <div className="sticky top-0 flex h-screen flex-col items-center justify-end px-6 pb-[7vh]">
        {/* Reserved for the trolley and the descending hand behind this layer. */}
        <div className="grow" aria-hidden />

        <div className="relative z-20 mx-auto max-w-2xl text-center">
          <h1 className="text-balance-tight text-[1.55rem] font-medium leading-[1.5] tracking-[-0.01em] text-ink sm:text-[1.75rem]">
            Every part of your store, thinking for itself.
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-balance-tight text-[0.98rem] leading-[1.75] text-ink-soft sm:text-base">
            Growmerce builds AI products that run the unglamorous half of
            ecommerce — search, merchandising, restocking, conversion — so your
            catalogue keeps working long after you have closed the laptop.
          </p>

          <a
            href="#voiceshop"
            className="mt-8 inline-flex h-[52px] items-center justify-center rounded-[10px] bg-brand px-12 text-[0.95rem] font-semibold tracking-[0.01em] text-white shadow-[0_12px_28px_-14px_rgba(239,108,37,0.85)] transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:bg-[#e0601c] hover:shadow-[0_16px_34px_-14px_rgba(239,108,37,0.9)]"
          >
            Book a demo
          </a>

          <div className="mt-10 flex flex-col items-center gap-2.5 text-[0.65rem] uppercase tracking-[0.24em] text-ink-mute/80">
            <span>Scroll to fill the cart</span>
            <span className="h-8 w-px bg-gradient-to-b from-ink-mute/50 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
