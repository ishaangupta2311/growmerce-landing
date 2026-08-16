import Reveal from "@/components/site/Reveal";
import styles from "../bazaar.module.css";
import { Barcode, SectionHeading, Sparkle, Stamp } from "./bits";

const RULES = [
  {
    rule: "Ship fast",
    body: "Small releases beat big roadmaps. If it can go out this week, it goes out this week.",
  },
  {
    rule: "Charge from day one",
    body: "A paying store owner is the only validation we trust. Free pilots tell you nothing.",
  },
  {
    rule: "Depth over breadth",
    body: "One workflow done properly, end to end — not forty features done to demo standard.",
  },
  {
    rule: "Install, don’t migrate",
    body: "Our tools fit the store you already run. No replatforming, no six-week onboarding.",
  },
  {
    rule: "Build in public",
    body: "Founder-led and openly worked on — the wrong turns included.",
  },
];

function SlipRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-end gap-2">
      <span className="shrink-0">{label}</span>
      <span aria-hidden className={styles.leader} />
      <span className="shrink-0 font-bold">{value}</span>
    </div>
  );
}

export default function PackingSlip() {
  return (
    <section
      id="house-rules"
      aria-labelledby="rules-title"
      className="relative border-y-[3px] border-[#2b1c14] bg-[#ffe8df] px-5 py-20 sm:px-8 lg:py-24"
    >
      <div className="mx-auto grid w-full max-w-[1280px] items-center gap-14 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16">
        <Reveal>
          <div>
            <SectionHeading
              eyebrow="Enclosed with every box"
              eyebrowTone="orange"
              title={<span id="rules-title">House rules</span>}
              lead="Five things we decided before we wrote any code, printed on the slip that goes out with everything we ship, and checked against every week."
            />

            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Stamp tone="ink" rot={-5}>
                No exceptions
              </Stamp>
              <p
                className={`${styles.hand} flex items-center gap-2 text-[22px] leading-tight text-[#d1400a]`}
              >
                <Sparkle className={`${styles.twinkle} size-3.5`} />
                yes, the paper really tears
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div
            className={`${styles.receiptShadow} mx-auto w-full max-w-[540px] rotate-[-1.3deg]`}
          >
            <div
              className={`${styles.receipt} ${styles.mono} ${styles.grain} bg-[#fffdf8] px-6 pt-9 pb-10 text-[#2b1c14] sm:px-9`}
            >
              <div className="relative z-[2]">
                <p
                  className={`${styles.poster} text-center text-[26px] tracking-[0.04em] sm:text-[30px]`}
                >
                  Growmerce
                </p>
                <p className="mt-1 text-center text-[11px] font-bold tracking-[0.28em] uppercase">
                  Packing slip
                </p>

                <div className="mt-5 space-y-1 border-y-2 border-dashed border-[#2b1c14]/45 py-3 text-[12.5px]">
                  <SlipRow label="ORDER" value="GRW·05·0001" />
                  <SlipRow label="PACKED IN" value="DELHI, INDIA" />
                  <SlipRow label="SHIPS TO" value="EVERYWHERE" />
                </div>

                <div className="mt-4 flex items-end justify-between text-[13px] font-bold tracking-[0.14em] uppercase">
                  <span>House rules</span>
                  <span>Qty 5</span>
                </div>
                <div
                  aria-hidden
                  className="mt-1.5 h-[3px] w-full bg-[#2b1c14]"
                />

                <ol className="mt-4 space-y-4">
                  {RULES.map((item, i) => (
                    <li key={item.rule}>
                      <div className="flex items-end gap-2 text-[13.5px]">
                        <span className="shrink-0 font-bold">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span
                          className={`${styles.display} shrink-0 text-[16px] font-extrabold tracking-normal`}
                        >
                          {item.rule}
                        </span>
                        <span aria-hidden className={styles.leader} />
                        <span className="shrink-0 font-bold">x1</span>
                      </div>
                      <p className="mt-1 pl-6 text-[12.5px] leading-relaxed text-[#5a4034]">
                        {item.body}
                      </p>
                    </li>
                  ))}
                </ol>

                <div
                  aria-hidden
                  className="mt-5 h-[3px] w-full bg-[#2b1c14]"
                />
                <div className="mt-3 flex items-end justify-between text-[14px] font-bold tracking-[0.1em] uppercase">
                  <span>Total</span>
                  <span>5 rules · 0 exceptions</span>
                </div>

                <div className="mt-7 flex flex-col items-center">
                  <Barcode
                    seed="house-rules-slip"
                    bars={44}
                    className="h-12 w-full max-w-[280px]"
                  />
                  <p className="mt-2 text-[10.5px] font-bold tracking-[0.3em]">
                    GRW·HOUSE·RULES·05
                  </p>
                  <p className="mt-4 text-[11.5px] font-bold tracking-[0.16em] uppercase">
                    Packed by: the founder
                  </p>
                  <p
                    className={`${styles.hand} mt-2 text-[24px] leading-none text-[#d1400a]`}
                  >
                    thanks for shopping small
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
