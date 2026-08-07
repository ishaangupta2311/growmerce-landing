"use client";

import { useSection } from "@/lib/useSection";

/**
 * The product IS the headline — literally, now. There is no hero copy: a large
 * lit trolley sits in the upper two thirds with the robot hand reaching in from
 * the top of frame, and the only words are the CTA and the feature row.
 *
 * The trolley is staged behind this layer and, unusually, is not something this
 * component can see. So the two lanes are divided in viewport units and nothing
 * else: the spacer below reserves the trolley's band, and Rig.tsx pins the
 * wheels to HERO_GROUND, a fraction of the same viewport height. Change one
 * without the other and the cart starts sitting on the button again.
 */

const FEATURES = [
  {
    title: "Search that listens",
    body: "Voiceshop matches plain sentences to real, in-stock products.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m20 20-4.9-4.9" />
        <path d="M8 10.5h5M10.5 8v5" />
      </svg>
    ),
  },
  {
    title: "Listings that rank",
    body: "Ranklift rewrites product copy against live search demand.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 6h16M4 12h10M4 18h13" />
        <path d="m19.5 10.5 1.5 1.5-1.5 1.5" />
      </svg>
    ),
  },
  {
    title: "Stock that thinks",
    body: "Restock IQ times reorders from velocity and supplier lead times.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 8.5v8.4l-9 4.6-9-4.6V8.5L12 4z" />
        <path d="M3.3 8.6 12 13l8.7-4.4M12 13v8" />
      </svg>
    ),
  },
  {
    title: "Carts that convert",
    body: "Convert Copilot tunes bundles, pricing and placement per visitor.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 20V10M10 20V4M16 20v-7" />
        <path d="m16 8 3-3 2 2" />
      </svg>
    ),
  },
];

export default function Hero() {
  const ref = useSection<HTMLElement>("hero");

  return (
    <section ref={ref} className="relative min-h-[185vh]">
      {/*
        The copy is pinned to the viewport for the whole section rather than
        scrolling through it. The trolley lives in a fixed WebGL layer, so any
        copy that scrolls will eventually cross it — pinning gives the two a
        permanent lane each: cart above, copy and features below.
      */}
      <div className="sticky top-0 flex h-screen flex-col items-center px-6">
        {/* The trolley's band: it hangs from the top of frame down to its
            wheels at HERO_GROUND (0.62). Everything below this line is copy. */}
        <div className="h-[66vh] shrink-0" aria-hidden />

        <a
          href="#voiceshop"
          className="relative z-20 inline-flex h-[54px] shrink-0 items-center justify-center rounded-lg bg-brand px-12 text-[0.88rem] font-bold uppercase tracking-[0.09em] text-white shadow-[0_14px_30px_-14px_rgba(242,101,34,0.9)] transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:bg-[#e0591a]"
        >
          Book a demo
        </a>

        <div className="relative z-20 mt-auto hidden w-full max-w-6xl grid-cols-4 gap-10 pb-9 pt-10 md:grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-3.5 text-left">
              <span className="mt-0.5 h-6 w-6 shrink-0 text-ink-soft">{f.icon}</span>
              <div>
                <h3 className="text-[0.95rem] font-bold leading-snug text-ink">
                  {f.title}
                </h3>
                <p className="mt-1 text-[0.8rem] leading-[1.6] text-ink-mute">
                  {f.body}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="pb-10 md:hidden" aria-hidden />
      </div>
    </section>
  );
}
