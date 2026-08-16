import Image from "next/image";
import styles from "../shopfront.module.css";
import { AwningBand, PrimaryButton, SecondaryButton, Sparkle } from "./bits";
import HeroSearch from "./HeroSearch";

function Underline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 18"
      fill="none"
      aria-hidden
      preserveAspectRatio="none"
      className={className}
    >
      <path
        d="M3 12.5C58 5.5 138 3 297 6.5"
        stroke="#ff5a1f"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-8 sm:pt-16 lg:pt-20 lg:pb-16">
      {/* Warm light pooling behind the shopfront panel. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[-14%] right-[-12%] size-[620px] rounded-full bg-[radial-gradient(circle,rgba(255,152,60,0.28),transparent_66%)] blur-[2px]"
      />

      <div className="mx-auto grid w-full max-w-[1280px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
        <div className="relative z-10">
          <p
            className="hero-enter inline-flex items-center gap-2 rounded-full border border-[#171717]/12 bg-[#ffffff] py-1.5 pr-4 pl-3 text-[13px] font-semibold tracking-wide text-[#4a4a4a] shadow-[0_6px_14px_-10px_rgba(96,44,14,0.9)]"
            style={{ animationDelay: "60ms" }}
          >
            <Sparkle className={`${styles.twinkle} size-3 text-[#ff5a1f]`} />
            An ecommerce AI studio · Delhi → global
          </p>

          <h1
            className={`${styles.display} hero-enter mt-6 text-[clamp(2.65rem,6.2vw,4.5rem)] leading-[0.98] font-extrabold text-balance`}
            style={{ animationDelay: "140ms" }}
          >
            The{" "}
            <span className="relative inline-block whitespace-nowrap">
              high street
              <Underline className="absolute -bottom-1 left-0 h-[0.16em] w-full" />
            </span>{" "}
            of AI tools for ecommerce.
          </h1>

          <p
            className="hero-enter mt-7 max-w-[38rem] text-[clamp(1.0625rem,1.45vw,1.25rem)] leading-relaxed text-[#4a4a4a]"
            style={{ animationDelay: "220ms" }}
          >
            AI is becoming table stakes for online stores — but most owners
            don&rsquo;t have an AI team, and most tools are either narrow
            gadgets or heavy platforms you&rsquo;d have to migrate to. Growmerce
            builds the practical middle: small, sharp tools you install today.
          </p>

          <div
            className="hero-enter mt-9 flex flex-wrap items-center gap-3"
            style={{ animationDelay: "300ms" }}
          >
            <PrimaryButton href="#early-access" size="lg">
              Get early access
            </PrimaryButton>
            <SecondaryButton href="#shopkeeper" size="lg">
              View demo
            </SecondaryButton>
          </div>

          <div
            className="hero-enter mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 text-[14px] text-[#8a8a8a]"
            style={{ animationDelay: "380ms" }}
          >
            <span className="inline-flex items-center gap-2 font-semibold text-[#171717]">
              <span
                aria-hidden
                className="size-2 rounded-full bg-[#93d3b8] ring-4 ring-[#93d3b8]/25"
              />
              First shop open: Growsearch
            </span>
            <span className="hidden h-4 w-px bg-[#171717]/15 sm:block" />
            <span>Launching now on the Shopify App Store</span>
          </div>
        </div>

        {/* The shopfront panel: canopy, lit window, mascot trolley. */}
        <div
          className="hero-enter-scale relative z-10 mt-2 lg:mt-0"
          style={{ animationDelay: "180ms" }}
        >
          <div className="relative mx-auto max-w-[560px]">
            <AwningBand className="h-11 rounded-t-[38px] shadow-[0_10px_20px_-16px_rgba(96,44,14,0.9)] sm:h-12" />

            <div className="relative overflow-hidden rounded-b-[38px] bg-[#ffffff] px-6 pt-16 pb-8 shadow-[0_36px_70px_-40px_rgba(96,44,14,0.75)] ring-1 ring-[#171717]/8 sm:px-9 sm:pb-10">
              {/* window glass + warm floor */}
              <div
                aria-hidden
                className="absolute inset-x-5 top-8 bottom-[132px] rounded-[26px] bg-[radial-gradient(120%_90%_at_50%_10%,#ffe4d6_0%,#ffd6c2_100%)]"
              />
              <div
                aria-hidden
                className={`${styles.glass} absolute inset-x-5 top-8 bottom-[132px] rounded-[26px]`}
              />

              <div className="relative flex items-end justify-center pb-6">
                <Image
                  src="/img/hero-cart.png"
                  alt=""
                  width={474}
                  height={468}
                  priority
                  sizes="(max-width: 1024px) 60vw, 340px"
                  className={`${styles.drift} h-auto w-[62%] max-w-[310px] drop-shadow-[0_26px_26px_rgba(96,44,14,0.28)]`}
                />
                <div
                  aria-hidden
                  className="absolute bottom-3 h-3 w-[46%] rounded-[50%] bg-[#c98a63]/35 blur-[6px]"
                />
              </div>

              <HeroSearch className="relative" />

              <p className="relative mt-4 flex items-center justify-between gap-3 text-[12.5px] text-[#8a8a8a]">
                <span className={`${styles.hand} text-[19px] text-[#ff5a1f]`}>
                  a small wink at our first shop
                </span>
                <span className="font-semibold tracking-wide uppercase opacity-70">
                  Growsearch
                </span>
              </p>
            </div>

            {/* Floating window stickers. */}
            <div
              className={`${styles.driftSlow} absolute -top-4 -left-4 z-10 rotate-[-7deg] rounded-2xl bg-[#ffcf6b] px-4 py-2.5 shadow-[0_16px_30px_-18px_rgba(96,44,14,0.95)] sm:-left-8`}
            >
              <span className={`${styles.display} text-[15px] font-extrabold`}>
                No dead ends
              </span>
            </div>

            <div
              className={`${styles.drift} absolute -right-3 bottom-44 z-10 rotate-[6deg] rounded-2xl bg-[#171717] px-4 py-2.5 text-white shadow-[0_16px_30px_-16px_rgba(96,44,14,0.95)] sm:-right-7`}
              style={{ animationDelay: "1.4s" }}
            >
              <span className={`${styles.display} text-[15px] font-extrabold`}>
                Search → checkout
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
