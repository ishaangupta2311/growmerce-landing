import Image from "next/image";
import styles from "../bazaar.module.css";
import {
  GunTag,
  PrimaryButton,
  SecondaryButton,
  Sparkle,
  Starburst,
  Sticker,
  Tape,
} from "./bits";

export default function Hero() {
  return (
    <section className="relative px-5 pt-10 pb-14 sm:px-8 sm:pt-14 lg:pt-16 lg:pb-20">
      {/* Warm print bloom behind the sticker pile. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[-10%] right-[-14%] size-[640px] rounded-full bg-[radial-gradient(circle,rgba(255,152,60,0.26),transparent_66%)]"
      />

      <div className="relative mx-auto grid w-full max-w-[1280px] items-center gap-12 lg:grid-cols-[1.04fr_0.96fr] lg:gap-8">
        {/* ------------------------------------------------------------------
            Left: the type explosion.
        ------------------------------------------------------------------ */}
        <div className="relative z-10">
          <div className="hero-enter" style={{ animationDelay: "60ms" }}>
            <span
              className={`${styles.mono} inline-flex -rotate-[1.8deg] items-center gap-2 border-2 border-[#2b1c14] bg-[#ffd66e] px-3 py-1.5 text-[10px] font-bold tracking-[0.16em] uppercase shadow-[3px_4px_0_rgba(96,44,14,0.3)] sm:text-[12px]`}
            >
              <Sparkle className={`${styles.twinkle} size-3 text-[#d1400a]`} />
              An ecommerce AI studio · Delhi → global
            </span>
          </div>

          <h1
            className={`${styles.poster} hero-enter mt-7 text-[clamp(3.05rem,8.6vw,6.1rem)] text-[#2b1c14]`}
            style={{ animationDelay: "140ms" }}
          >
            <span className="block -rotate-[1.6deg]">Practical AI</span>

            {/* The tape holds the middle line down onto the page. */}
            <span className="relative mt-1 block w-fit rotate-[0.9deg]">
              for people who
              <Tape className="absolute top-[30%] -left-[4%] z-10 h-[22px] w-[78%] rotate-[2.4deg] sm:h-[30px] lg:h-[36px]" />
            </span>

            <span className="mt-2.5 block">
              <span
                className={`${styles.sticker} ${styles.grain} inline-block rounded-[16px] bg-[#ff5c1a] px-4 pt-2 pb-3 text-white sm:px-6`}
                style={{ "--rot": "-2.4deg" } as React.CSSProperties}
              >
                sell things
              </span>
            </span>
          </h1>

          <div
            className="hero-enter relative mt-9 max-w-[37rem]"
            style={{ animationDelay: "220ms" }}
          >
            <p className="-rotate-[0.6deg] border-[3px] border-[#2b1c14] bg-[#fffaf5] px-5 py-4 text-[clamp(1rem,1.4vw,1.15rem)] leading-relaxed text-[#3d2a20] shadow-[5px_6px_0_rgba(96,44,14,0.28)] sm:px-6 sm:py-5">
              AI is becoming table stakes for online stores — but most owners
              don&rsquo;t have an AI team, and most tools are either narrow
              gadgets or heavy platforms you&rsquo;d have to migrate to.
              Growmerce builds the practical middle:{" "}
              <strong className="font-extrabold">
                small, sharp tools you install today.
              </strong>
            </p>
          </div>

          <div
            className="hero-enter mt-9 flex flex-wrap items-center gap-4"
            style={{ animationDelay: "300ms" }}
          >
            <PrimaryButton href="#early-access" size="lg">
              Get early access
            </PrimaryButton>
            <SecondaryButton href="#founder" size="lg">
              View demo
            </SecondaryButton>
          </div>

          <div
            className="hero-enter mt-8 flex flex-wrap items-center gap-x-4 gap-y-3 text-[14px] text-[#5a4034]"
            style={{ animationDelay: "380ms" }}
          >
            <span
              className={`${styles.mono} inline-flex items-center gap-2 border-2 border-[#2b1c14] bg-[#fffaf5] px-3 py-1.5 text-[11.5px] font-bold tracking-[0.12em] uppercase`}
            >
              <span
                aria-hidden
                className="size-2 rounded-full bg-[#93d3b8] ring-[3px] ring-[#93d3b8]/35"
              />
              In stock: Growsearch
            </span>
            <span className="font-semibold">
              Launching now on the Shopify App Store
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------------------
            Right: the sticker pile. A fixed square keeps the composition
            identical at every width — everything below is placed in percent.
        ------------------------------------------------------------------ */}
        <div
          className="hero-enter-scale relative z-10 mx-auto aspect-square w-full max-w-[380px] sm:max-w-[440px] lg:max-w-[540px]"
          style={{ animationDelay: "180ms" }}
        >
          {/* Print burst behind everything, turning very slowly. */}
          <div
            aria-hidden
            className={`${styles.starburstFine} ${styles.spin} absolute inset-[3%] bg-[#ffd7c5]/75`}
          />
          <div
            aria-hidden
            className="absolute inset-[13%] rounded-full bg-[radial-gradient(circle,rgba(255,246,238,0.95),rgba(255,232,223,0.5)_70%,transparent_72%)]"
          />

          {/* The trolley, wearing its price-gun tag. */}
          <div className="absolute top-1/2 left-1/2 w-[66%] -translate-x-1/2 -translate-y-[54%]">
            <Image
              src="/img/hero-cart.png"
              alt=""
              width={474}
              height={468}
              priority
              sizes="(max-width: 640px) 55vw, (max-width: 1024px) 40vw, 360px"
              className={`${styles.drift} h-auto w-full drop-shadow-[0_24px_22px_rgba(96,44,14,0.3)]`}
            />
          </div>
          <div
            aria-hidden
            className="absolute bottom-[20%] left-1/2 h-3 w-[38%] -translate-x-1/2 rounded-[50%] bg-[#c98a63]/35 blur-[6px]"
          />

          {/* Price-gun tag on a string, hooked over the handle. */}
          <div className="absolute top-[16%] right-[3%] w-[42%] sm:right-[0%]">
            <svg
              viewBox="0 0 60 40"
              fill="none"
              aria-hidden
              className="absolute -top-[26px] left-[10px] h-[30px] w-[52px]"
            >
              <path
                d="M2 2C10 22 26 26 44 34"
                stroke="#2b1c14"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <div className={`${styles.dangle} ${styles.swingOnHover}`}>
              <GunTag
                tone="butter"
                className="w-full border-2 border-[#2b1c14]"
              >
                <span
                  className={`${styles.poster} block text-[19px] leading-none sm:text-[23px]`}
                >
                  In stock
                </span>
                <span
                  className={`${styles.mono} mt-1 block text-[9px] leading-tight font-bold tracking-[0.12em] uppercase sm:text-[10px]`}
                >
                  No migration
                  <br />
                  required
                </span>
              </GunTag>
            </div>
          </div>

          {/* NEW! flash. */}
          <div className="absolute top-[1%] left-[-1%] size-[27%] sm:left-[-3%]">
            <Starburst
              className={`${styles.driftSlow} size-full bg-[#d1400a] text-white`}
            >
              <span
                className={`${styles.poster} text-[clamp(0.95rem,3.4vw,1.5rem)]`}
              >
                New!
              </span>
            </Starburst>
          </div>

          {/* Arch shelf label. */}
          <div className="absolute bottom-[9%] left-[-3%] w-[46%]">
            <Sticker
              rot={-4.5}
              peel
              className={`${styles.arch} ${styles.grain} bg-[#8ed4e6] px-3 pt-4 pb-3 text-center`}
            >
              <span
                className={`${styles.poster} block text-[clamp(1rem,3.2vw,1.4rem)] text-[#2b1c14]`}
              >
                Growsearch
              </span>
              <span
                className={`${styles.mono} mt-1 block text-[9px] font-bold tracking-[0.14em] text-[#0f4d5e] uppercase sm:text-[10px]`}
              >
                Aisle 01
              </span>
            </Sticker>
          </div>

          {/* Two small chips, one each side, to close the composition. */}
          <div className="absolute right-[-3%] bottom-[31%]">
            <Sticker
              rot={5}
              className="rounded-full bg-[#ffd66e] px-3.5 py-2"
            >
              <span
                className={`${styles.display} text-[12px] font-extrabold text-[#2b1c14] sm:text-[14px]`}
              >
                No dead ends
              </span>
            </Sticker>
          </div>

          <div className="absolute bottom-[1%] left-[36%]">
            <Sticker
              rot={-3}
              className="rounded-full bg-[#2b1c14] px-3.5 py-2"
            >
              <span
                className={`${styles.display} text-[12px] font-extrabold text-white sm:text-[14px]`}
              >
                Search → checkout
              </span>
            </Sticker>
          </div>
        </div>
      </div>
    </section>
  );
}
