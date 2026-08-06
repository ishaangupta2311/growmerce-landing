"use client";

import type { Product } from "@/lib/products";
import { clsx } from "@/lib/clsx";
import { useScene } from "@/lib/scroll";
import { useReveal } from "@/lib/useReveal";
import { useSection } from "@/lib/useSection";

/**
 * One product per screen. The copy takes the side named on the product; the
 * opposite half is deliberately empty so the trolley in the WebGL layer has
 * somewhere to park.
 */
export default function ProductSection({ product }: { product: Product }) {
  const sectionRef = useSection<HTMLElement>(product.id);
  const { ref, visible } = useReveal<HTMLDivElement>();
  const collected = useScene((s) => s.collected.includes(product.id));

  const copyOnRight = product.side === "right";

  return (
    <section
      ref={sectionRef}
      id={product.id}
      className="relative flex min-h-[135vh] items-center px-6 md:px-12"
    >
      <div className="mx-auto grid w-full max-w-[1400px] items-center gap-10 md:grid-cols-2">
        {/* Spacer half — reserved for the cart. */}
        <div
          className={clsx("hidden md:block", copyOnRight ? "order-1" : "order-2")}
          aria-hidden
        />

        <div
          ref={ref}
          data-visible={visible}
          className={clsx(
            "relative z-20 max-w-xl translate-y-8 opacity-0 transition-all duration-[900ms] ease-out-expo",
            "data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100",
            copyOnRight ? "order-2 md:justify-self-end" : "order-1",
            // Mobile stacks under the cart, so nudge the copy down the screen.
            "mt-[46vh] md:mt-0",
          )}
        >
          <span className="pill">{product.label}</span>

          <h2 className="mt-6 font-display text-[2.6rem] font-bold leading-[1.1] text-brand sm:text-[3.2rem]">
            {product.name}
          </h2>

          <p className="mt-5 max-w-md text-[1.05rem] font-medium leading-[1.75] text-ink">
            {product.blurb}
          </p>

          <span
            data-in={collected}
            className={clsx(
              "mt-7 inline-flex items-center gap-2 rounded-full bg-ink/5 px-4 py-2 text-sm font-medium text-ink-mute",
              "translate-y-1 opacity-0 transition-all duration-500 ease-out-expo",
              "data-[in=true]:translate-y-0 data-[in=true]:bg-brand-tint data-[in=true]:text-brand data-[in=true]:opacity-100",
            )}
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
              <path
                d="M4 10.5 8 14.5 16 6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Added to cart
          </span>
        </div>
      </div>
    </section>
  );
}
