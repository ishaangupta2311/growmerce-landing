import Image from "next/image";
import Link from "next/link";
import styles from "../ledger.module.css";
import Arrow from "@/components/site/Arrow";

const LEDGER_ROWS = [
  {
    no: "01",
    label: "Status",
    value: "Growsearch, live on the Shopify App Store",
  },
  {
    no: "02",
    label: "Desk",
    value: "Delhi — serving global ecommerce",
  },
  {
    no: "03",
    label: "Doctrine",
    value: "We sell proof, not platform",
  },
];

export default function Hero() {
  return (
    <section className="relative border-b border-[var(--ink-15)]">
      <div className="mx-auto grid max-w-[1180px] gap-12 px-6 pt-12 pb-14 sm:px-10 sm:pt-16 sm:pb-20 lg:grid-cols-[1fr_400px] lg:gap-16">
        <div>
          <div className="hero-enter flex items-baseline justify-between border-b border-[var(--ink-15)] pb-4">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[var(--ink-40)] uppercase">
              The Growmerce Report
            </p>
            <p className="hidden text-[11px] font-semibold tracking-[0.22em] text-[var(--ink-40)] uppercase sm:block">
              Founder-led · Built in public
            </p>
          </div>

          <h1
            className={`${styles.serif} hero-enter mt-8 text-[2.75rem] leading-[1.04] font-semibold text-[var(--ink)] sm:text-[3.6rem] lg:text-[4.1rem]`}
            style={{ animationDelay: "80ms" }}
          >
            Practical AI, for the people actually running the store.
          </h1>

          <p
            className="hero-enter mt-7 max-w-[46ch] text-[17px] leading-relaxed text-[var(--ink-70)] sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            AI is becoming table stakes for ecommerce — but most operators
            have no AI team, and most tools on offer are narrow gadgets or
            heavy platforms. Growmerce builds practical tools that install
            into the store you already run.
          </p>

          <div
            className="hero-enter mt-9 flex flex-wrap items-center gap-x-8 gap-y-4"
            style={{ animationDelay: "220ms" }}
          >
            <Link
              href="#cta"
              className="inline-flex items-center gap-3 bg-[var(--ink)] px-7 py-3.5 text-[15px] font-semibold tracking-[0.02em] text-[var(--paper)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              Get early access
              <Arrow className="h-4 w-4" />
            </Link>
            <Link
              href="#cta"
              className="inline-flex items-center gap-2 border-b border-[var(--ink)] pb-0.5 text-[15px] font-semibold text-[var(--ink)] transition-colors hover:border-brand hover:text-brand"
            >
              View demo
            </Link>
          </div>

          <dl className="mt-12 divide-y divide-[var(--ink-15)] border-t border-[var(--ink-15)]">
            {LEDGER_ROWS.map((row, i) => (
              <div
                key={row.no}
                className="hero-enter flex items-baseline justify-between gap-4 py-3.5"
                style={{ animationDelay: `${280 + i * 70}ms` }}
              >
                <dt className="flex items-baseline gap-3 text-[13px] font-semibold tracking-[0.14em] text-[var(--ink-40)] uppercase">
                  <span className={`${styles.serif} text-[var(--ink-25)] italic`}>{row.no}</span>
                  {row.label}
                </dt>
                <dd className="text-right text-[15px] text-[var(--ink-85)]">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div
          className="hero-enter-scale relative order-first aspect-[4/5] w-full overflow-hidden lg:order-none"
          style={{ animationDelay: "140ms" }}
        >
          <Image
            src="/img/hero-shopper.jpg"
            alt="A shopper on a city street at dusk — the person every search result is for."
            fill
            sizes="(min-width: 1024px) 400px, 100vw"
            className={`${styles.plateImage} object-cover`}
            priority
          />
          <div className={styles.plateTint} aria-hidden />
          <div className={styles.plateScrim} aria-hidden />
          <p className="absolute bottom-4 left-4 right-4 text-[11px] font-semibold tracking-[0.14em] text-[var(--paper)]/90 uppercase">
            Fig. 0 — Behind every search, a shopper.
          </p>
        </div>
      </div>
    </section>
  );
}
