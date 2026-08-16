import Link from "next/link";
import Arrow from "./Arrow";
import Reveal from "./Reveal";

export default function PricingBand() {
  return (
    <section
      id="pricing"
      className="relative mt-24 overflow-hidden bg-[#ff5a1f] py-20 text-white"
    >
      {/* Soft light blooms so the band isn't a flat fill. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-[-10%] size-[480px] rounded-full bg-white/10 blur-[100px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 left-[30%] size-[420px] rounded-full bg-[#ffd2b0]/20 blur-[110px]"
      />

      <div className="relative mx-auto max-w-[1370px] px-6">
        <Reveal>
          <p className="text-base font-medium tracking-wide uppercase">
            Plans &amp; pricing
          </p>
          <h2 className="mt-3 max-w-[530px] font-grotesk text-[clamp(2rem,3.5vw,3.125rem)] leading-[1.28]">
            Choose the perfect Growmerce plan for your business
          </h2>
          <div className="mt-8 inline-block rounded-[13px] border border-white/90 p-[5px]">
            <Link
              href="#demo"
              className="block-cta rounded-[11px] bg-white text-brand"
            >
              Get My custom Plan
              <Arrow className="cta-arrow" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
