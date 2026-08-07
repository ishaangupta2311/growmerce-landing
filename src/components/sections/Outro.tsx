"use client";

import { PRODUCTS } from "@/lib/products";
import { useScene } from "@/lib/scroll";
import { useReveal } from "@/lib/useReveal";
import { useSection } from "@/lib/useSection";

/**
 * The payoff. By the time this is in view the trolley is fully digitised and
 * carrying every product, so the copy simply names what just happened.
 *
 * Pinned like the hero: the trolley owns the upper half of the viewport for the
 * whole section, the copy owns the lower half, and neither crosses the other.
 */
export default function Outro() {
  const sectionRef = useSection<HTMLElement>("outro");
  const { ref, visible } = useReveal<HTMLDivElement>();
  const collected = useScene((s) => s.collected);

  return (
    <section ref={sectionRef} id="outro" className="relative min-h-[165vh]">
      {/* pb-[30vh] is not whitespace for its own sake: it reserves the bottom
          third of the viewport as the finale lane, where the trolley grounds
          itself and the robot walks in. Shrink it and the two collide. */}
      <div className="sticky top-0 flex h-screen flex-col items-center justify-end px-6 pb-[34vh]">
        <div className="grow" aria-hidden />

        <div
          ref={ref}
          data-visible={visible}
          className="relative z-20 max-w-2xl translate-y-6 text-center opacity-0 transition-all duration-[900ms] ease-out-expo data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100"
        >
          <span className="pill border-digital/40 text-digital">Your cart</span>

          <h2 className="mt-5 text-[2.4rem] font-bold leading-[1.06] tracking-[-0.025em] text-ink sm:text-[3.1rem]">
            One trolley.
            <span className="block text-digital">Four fewer problems.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-lg text-balance-tight text-[0.98rem] leading-[1.75] text-ink-soft sm:text-base">
            The steel came in. The software went out. Growmerce turns the
            mechanical parts of retail into systems that improve on their own —
            and you keep the part that was ever really yours.
          </p>

          <ul className="mt-7 flex flex-wrap justify-center gap-2">
            {PRODUCTS.map((p) => (
              <li
                key={p.id}
                className="rounded-full border border-digital/20 bg-digital/[0.05] px-3.5 py-1.5 text-[0.8rem] font-medium text-digital/90"
              >
                {p.name}
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#demo"
              className="inline-flex h-[52px] items-center justify-center rounded-[10px] bg-brand px-10 text-[0.95rem] font-semibold text-white shadow-[0_12px_28px_-14px_rgba(239,108,37,0.85)] transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:bg-[#e0601c]"
            >
              Check out {collected.length > 0 ? `(${collected.length})` : ""}
            </a>
            <a
              href="#pricing"
              className="inline-flex h-[52px] items-center justify-center rounded-[10px] border border-ink/12 px-9 text-[0.95rem] font-semibold text-ink transition-colors duration-300 hover:border-ink/30"
            >
              See pricing
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
