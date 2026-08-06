"use client";

import { PRODUCTS } from "@/lib/products";
import { useScene } from "@/lib/scroll";
import { useReveal } from "@/lib/useReveal";
import { useSection } from "@/lib/useSection";

/**
 * The payoff. By the time this is in view the trolley is fully digitised and
 * carrying every product, so the copy simply names what just happened.
 */
export default function Outro() {
  const sectionRef = useSection<HTMLElement>("outro");
  const { ref, visible } = useReveal<HTMLDivElement>();
  const collected = useScene((s) => s.collected);

  return (
    <section
      ref={sectionRef}
      id="outro"
      className="relative flex min-h-[145vh] flex-col items-center px-6 pb-[14vh]"
    >
      {/* Kept clear for the fully digitised trolley, the same way the hero is. */}
      <div className="h-[54vh] shrink-0" aria-hidden />

      <div
        ref={ref}
        data-visible={visible}
        className="relative z-20 max-w-2xl translate-y-8 text-center opacity-0 transition-all duration-[900ms] ease-out-expo data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100"
      >
        <span className="pill border-digital/50 text-digital">Your cart</span>

        <h2 className="mt-6 font-display text-[2.8rem] font-bold leading-[1.08] text-ink sm:text-[3.6rem]">
          One trolley.
          <span className="block text-digital">Four fewer problems.</span>
        </h2>

        <p className="mx-auto mt-6 max-w-lg text-balance-tight text-[1.05rem] leading-[1.75] text-ink-soft">
          The steel came in. The software went out. Growmerce turns the mechanical
          parts of retail into systems that improve on their own — and you keep
          the part that was ever really yours.
        </p>

        <ul className="mt-9 flex flex-wrap justify-center gap-2.5">
          {PRODUCTS.map((p) => (
            <li
              key={p.id}
              className="rounded-full border border-digital/25 bg-digital/[0.06] px-4 py-2 text-sm font-medium text-digital"
            >
              {p.name}
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#demo"
            className="inline-flex h-14 items-center justify-center rounded-xl bg-brand px-12 text-base font-semibold text-white shadow-[0_10px_30px_-12px_rgba(239,108,37,0.8)] transition-transform duration-300 ease-out-expo hover:-translate-y-0.5 hover:bg-[#e0601c]"
          >
            Check out {collected.length > 0 ? `(${collected.length})` : ""}
          </a>
          <a
            href="#pricing"
            className="inline-flex h-14 items-center justify-center rounded-xl border border-ink/15 px-10 text-base font-semibold text-ink transition-colors duration-300 hover:border-ink/35"
          >
            See pricing
          </a>
        </div>
      </div>
    </section>
  );
}
