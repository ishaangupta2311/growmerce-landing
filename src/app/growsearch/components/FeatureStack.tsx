import Link from "next/link";
import Reveal from "@/components/site/Reveal";
import Arrow from "@/components/site/Arrow";
import styles from "./FeatureStack.module.css";

/* Small CSS-only mock UIs standing in for the per-card screenshots — no new
   image assets, just a tasteful stand-in for what the Figma frame's
   grey `IMAGE` rectangle implies. */

function SearchRowsVisual() {
  return (
    <div className="w-full max-w-[300px] rounded-2xl border border-line bg-cream p-4">
      <div className="flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2">
        <span className="size-2 rounded-full bg-brand" />
        <span className="text-[13px] font-medium text-body-mute">
          &ldquo;warm but not bulky&rdquo;
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {["Fleece-lined jacket", "Packable puffer vest", "Lightweight wool coat"].map(
          (row) => (
            <div
              key={row}
              className="rounded-lg bg-white px-3 py-2 text-[13px] text-charcoal shadow-sm"
            >
              {row}
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function RecoveryVisual() {
  return (
    <div className="w-full max-w-[300px] rounded-2xl border border-line bg-cream p-4">
      <p className="text-[13px] text-muted line-through">kava drinks</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-white">
          0 results
        </span>
        <span className="text-[13px] text-body-mute">→ closest match</span>
      </div>
      <div className="mt-3 rounded-lg bg-white px-3 py-2 text-[13px] font-medium text-charcoal shadow-sm">
        Kratom Seltzers
      </div>
    </div>
  );
}

function AnalyticsVisual() {
  const bars = [40, 65, 50, 80, 60, 95];
  return (
    <div className="w-full max-w-[300px] rounded-2xl border border-line bg-cream p-4">
      <div className="flex h-24 items-end gap-2">
        {bars.map((h, i) => (
          <span
            key={i}
            className="flex-1 rounded-t-md bg-brand/70"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <p className="mt-3 text-[13px] font-medium text-body-mute">
        Search-attributed checkouts, live
      </p>
    </div>
  );
}

const ITEMS = [
  {
    title: "Understands what shoppers actually mean",
    body: "Vague, misspelled, or oddly worded — Growsearch reads the sentence, not just the keywords, and still finds the right shelf.",
    Visual: SearchRowsVisual,
  },
  {
    title: "Never lets a search go nowhere",
    body: "Typos get corrected, out-of-stock gets swapped for close alternatives, and empty result pages stop happening.",
    Visual: RecoveryVisual,
  },
  {
    title: "Proves it in the numbers",
    body: "Every search, click and cart add rolls up into one dashboard, so you can see exactly what search is worth.",
    Visual: AnalyticsVisual,
  },
];

export default function FeatureStack() {
  return (
    <section className="mx-auto max-w-[1370px] px-6 py-24">
      <Reveal>
        <h2 className="text-[clamp(1.75rem,4vw,3.25rem)] leading-[1.1] font-bold">
          One search bar, doing four jobs at once
        </h2>
        <p className="mt-4 max-w-[62ch] text-[17px] leading-relaxed text-body-mute">
          Every Growsearch capability keeps working after the first
          keystroke — scroll to see how a single query turns into a sale.
        </p>
      </Reveal>

      <div className={`mt-16 ${styles.stack}`}>
        {ITEMS.map(({ title, body, Visual }) => (
          <div key={title} className={styles.stackItem}>
            <article
              className={`${styles.stackCard} grid gap-8 rounded-[32px] border border-line bg-white p-8 shadow-glow-lg sm:grid-cols-[1fr_auto] sm:items-center sm:p-10`}
            >
              <div>
                <h3 className="text-2xl font-bold text-charcoal sm:text-[1.75rem]">
                  {title}
                </h3>
                <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-body-mute">
                  {body}
                </p>
              </div>
              <Visual />
            </article>
          </div>
        ))}
      </div>

      <div className="mt-14 flex justify-center">
        <Link
          href="/growsearch/features"
          className="block-cta bg-brand-bright text-white"
        >
          Explore all features
          <Arrow className="cta-arrow" />
        </Link>
      </div>
    </section>
  );
}
