import Image from "next/image";
import styles from "../nightmarket.module.css";
import { PrimaryButton, SecondaryButton, Sparkle } from "./bits";
import HeroSearch from "./HeroSearch";
import {
  Fireflies,
  Lamppost,
  NeonPlate,
  ShootingStar,
  Skyline,
  StringLights,
} from "./scenery";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pb-[86px]">
      {/* The street furniture, back to front. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(255,146,62,0.10),transparent_70%)]"
      />
      <ShootingStar className="top-[13%] left-[3%]" />
      {/* Haze on the horizon, so the rooftops read as silhouettes. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[86px] h-[260px] bg-[radial-gradient(72%_100%_at_50%_100%,rgba(255,138,60,0.26),transparent_74%)]"
      />
      <Skyline className="absolute inset-x-0 bottom-[86px] h-[140px] w-full sm:h-[180px] lg:h-[210px]" />
      <Fireflies />

      <StringLights
        className="absolute inset-x-[-3%] top-0 z-20 w-[106%]"
        swags={3}
        height={96}
      />

      <div className="relative z-10 mx-auto grid w-full max-w-[1280px] gap-12 px-5 pt-28 sm:px-8 sm:pt-32 lg:grid-cols-[1.02fr_0.98fr] lg:items-end lg:gap-10">
        <div className="relative z-10 lg:pb-6">
          <p
            className="hero-enter inline-flex items-center gap-2 rounded-full border border-[#ffc46b]/25 bg-[#2b1c13]/70 py-1.5 pr-4 pl-3 text-[13px] font-semibold tracking-wide text-[#e3cab4] backdrop-blur-[2px]"
            style={{ animationDelay: "60ms" }}
          >
            <Sparkle className={`${styles.twinkle} size-3 text-[#ffc46b]`} />
            An ecommerce AI studio · Delhi → global
          </p>

          <h1
            className={`${styles.display} hero-enter mt-6 text-[clamp(2.65rem,6.2vw,4.5rem)] leading-[0.98] font-extrabold text-balance text-[#fff2e4]`}
            style={{ animationDelay: "140ms" }}
          >
            The{" "}
            <span className="relative inline-block whitespace-nowrap">
              <span className={`${styles.neon} ${styles.flicker}`}>
                high street
              </span>
              <span
                aria-hidden
                className="absolute -bottom-1 left-0 h-[5px] w-full rounded-full bg-[#ff7a33] shadow-[0_0_8px_rgba(255,122,51,0.95),0_0_22px_rgba(255,92,26,0.7)]"
              />
            </span>{" "}
            of AI tools for ecommerce.
          </h1>

          <p
            className="hero-enter mt-7 max-w-[38rem] text-[clamp(1.0625rem,1.45vw,1.25rem)] leading-relaxed text-[#e3cab4]"
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
              Book a founder demo
            </SecondaryButton>
          </div>

          <div
            className="hero-enter mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 text-[14px] text-[#bda28c]"
            style={{ animationDelay: "380ms" }}
          >
            <span className="inline-flex items-center gap-2 font-semibold text-[#fff2e4]">
              <span
                aria-hidden
                className={`${styles.breathe} size-2 rounded-full bg-[#93d3b8] shadow-[0_0_10px_rgba(147,211,184,0.9)] ring-4 ring-[#93d3b8]/20`}
              />
              First shop open: Growsearch
            </span>
            <span className="hidden h-4 w-px bg-[#ffc46b]/20 sm:block" />
            <span>Launching now on the Shopify App Store</span>
          </div>
        </div>

        {/* The scene: a lamppost, a pool of light, and the trolley parked in
            it under a neon sign. */}
        <div
          className="hero-enter-scale relative h-[420px] sm:h-[470px] lg:h-[540px]"
          style={{ animationDelay: "180ms" }}
        >
          <NeonPlate
            className="absolute top-0 right-1 z-30 w-[152px] sm:right-4 sm:w-[176px]"
            flicker
          >
            Open late
          </NeonPlate>

          <Lamppost className="absolute bottom-[52px] left-[2%] h-[74%] sm:left-[4%]" />

          {/* Pool of lamplight on the pavement, then the trolley standing in it. */}
          <div
            aria-hidden
            className={`${styles.pool} absolute bottom-[26px] left-[46%] h-[70px] w-[86%] -translate-x-1/2 rounded-[50%]`}
          />
          <Image
            src="/img/hero-cart.png"
            alt=""
            width={474}
            height={468}
            priority
            sizes="(max-width: 1024px) 62vw, 340px"
            className={`${styles.drift} absolute bottom-[46px] left-[48%] w-[56%] max-w-[320px] -translate-x-1/2 [filter:sepia(0.16)_saturate(1.08)_brightness(0.94)_drop-shadow(0_0_34px_rgba(255,168,92,0.45))]`}
          />
          <div
            aria-hidden
            className="absolute bottom-[42px] left-[48%] h-3 w-[34%] -translate-x-1/2 rounded-[50%] bg-[#0d0703]/70 blur-[7px]"
          />

          <p
            className={`${styles.hand} absolute top-[2%] left-0 z-20 max-w-[8.5rem] text-[20px] leading-tight text-[#ffc46b]`}
          >
            the lights stay on while you sleep
          </p>

          {/* Lit plates propped against the scene. */}
          <div
            className={`${styles.driftSlow} absolute top-[30%] left-0 z-20 rotate-[-6deg] rounded-2xl bg-[#ffc46b] px-4 py-2.5 shadow-[0_0_26px_-4px_rgba(255,196,107,0.8),0_14px_24px_-16px_rgba(0,0,0,0.95)]`}
          >
            <span
              className={`${styles.display} text-[15px] font-extrabold text-[#20140c]`}
            >
              No dead ends
            </span>
          </div>

          <div
            className={`${styles.drift} ${styles.tube} absolute top-[46%] right-0 z-20 rotate-[5deg] rounded-2xl bg-[#20140c]/90 px-4 py-2.5`}
            style={{ animationDelay: "1.4s" }}
          >
            <span
              className={`${styles.display} text-[15px] font-extrabold text-[#fff2e4]`}
            >
              Search → checkout
            </span>
          </div>

          <HeroSearch className="absolute inset-x-0 bottom-0 z-20" />
        </div>
      </div>

      {/* The pavement the whole street stands on. */}
      <div
        aria-hidden
        className={`${styles.pavement} absolute inset-x-0 bottom-0 h-[86px]`}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-[84px] h-px bg-[#ffc46b]/25"
      />
    </section>
  );
}
