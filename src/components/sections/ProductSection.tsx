"use client";

import type { Product } from "@/lib/products";
import { clsx } from "@/lib/clsx";
import { useScene } from "@/lib/scroll";
import { useReveal } from "@/lib/useReveal";
import { useSection } from "@/lib/useSection";

/**
 * One product per screen. The copy takes the side named on the product; the
 * opposite half is deliberately empty so the trolley has somewhere to park.
 *
 * Pinned to the viewport for the length of the section so the copy holds still
 * while the trolley travels across to it, rather than the two sliding past
 * each other.
 */
export default function ProductSection({ product }: { product: Product }) {
  const sectionRef = useSection<HTMLElement>(product.id);
  const { ref, visible } = useReveal<HTMLDivElement>();
  const collected = useScene((s) => s.collected.includes(product.id));

  const copyOnRight = product.side === "right";

  return (
    <section ref={sectionRef} id={product.id} className="relative min-h-[150vh]">
      <div className="sticky top-0 flex h-screen items-center px-6 md:px-12">
        <div className="mx-auto grid w-full max-w-[1360px] items-center gap-8 md:grid-cols-2">
          {/* Spacer half — reserved for the cart. */}
          <div
            className={clsx("hidden md:block", copyOnRight ? "order-1" : "order-2")}
            aria-hidden
          />

          <div
            ref={ref}
            data-visible={visible}
            className={clsx(
              "relative z-20 max-w-[30rem] translate-y-6 opacity-0 transition-all duration-[900ms] ease-out-expo",
              "data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100",
              copyOnRight ? "order-2 md:justify-self-end" : "order-1",
              // Mobile stacks under the cart, so push the copy down the screen.
              "mt-[42vh] md:mt-0",
            )}
          >
            <span className="pill">{product.label}</span>

            <h2 className="mt-5 font-display text-[2.35rem] font-bold leading-[1.08] tracking-[-0.015em] text-brand sm:text-[2.9rem]">
              {product.name}
            </h2>

            <p className="mt-4 max-w-md text-[0.98rem] font-normal leading-[1.75] text-ink-soft sm:text-base">
              {product.blurb}
            </p>

            <span
              data-in={collected}
              className={clsx(
                "mt-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.8rem] font-medium",
                "translate-y-1 bg-ink/[0.04] text-ink-mute opacity-0 transition-all duration-500 ease-out-expo",
                "data-[in=true]:translate-y-0 data-[in=true]:bg-brand-tint data-[in=true]:text-brand data-[in=true]:opacity-100",
              )}
            >
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden>
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
      </div>
    </section>
  );
}
