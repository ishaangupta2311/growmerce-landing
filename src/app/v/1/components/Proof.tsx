import styles from "../ledger.module.css";
import Reveal from "@/components/site/Reveal";
import CountUp from "./CountUp";

export default function Proof() {
  return (
    <section id="proof" className="scroll-mt-20 border-b border-[var(--ink-15)]">
      <div className="mx-auto max-w-[1180px] px-6 py-20 sm:px-10 sm:py-28">
        <Reveal>
          <div className="flex items-baseline justify-between gap-6">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-brand uppercase">
              § 04 · Proof, cited
            </p>
            <div className="draw-line h-px flex-1 bg-[var(--ink-15)]" />
          </div>
          <h2 className={`${styles.serif} mt-6 max-w-[26ch] text-[2rem] leading-[1.12] font-semibold sm:text-[2.6rem]`}>
            The category is already moving.
          </h2>
          <p className="mt-5 max-w-[58ch] text-[16px] leading-relaxed text-[var(--ink-70)]">
            We&rsquo;re early — these are published category benchmarks, not
            Growmerce customer results. They&rsquo;re the reason we&rsquo;re
            building here.
          </p>
        </Reveal>

        <Reveal delay={100} className="mt-12">
          <table className={styles.ledgerTable}>
            <thead>
              <tr>
                <th className="text-[11px] font-semibold tracking-[0.14em] text-[var(--ink-40)] uppercase">
                  Metric
                </th>
                <th className="text-[11px] font-semibold tracking-[0.14em] text-[var(--ink-40)] uppercase">
                  Value
                </th>
                <th className="text-[11px] font-semibold tracking-[0.14em] text-[var(--ink-40)] uppercase">
                  Source
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-[15px] text-[var(--ink-85)]">
                  Conversion lift from AI-powered search &amp; assistants
                </td>
                <td className={`${styles.serif} text-[1.35rem] font-semibold tabular-nums text-[var(--ink)]`}>
                  10–<CountUp to={30} suffix="%" />
                </td>
                <td className="text-[13px] text-[var(--ink-40)] uppercase tracking-[0.06em]">Rep AI</td>
              </tr>
              <tr>
                <td className="text-[15px] text-[var(--ink-85)]">
                  Conversion rate for AI-assisted shoppers
                </td>
                <td className={`${styles.serif} text-[1.35rem] font-semibold tabular-nums text-[var(--ink)]`}>
                  <CountUp from={1} to={6} suffix="×" />
                </td>
                <td className="text-[13px] text-[var(--ink-40)] uppercase tracking-[0.06em]">
                  iAdvize × Kendra Scott
                </td>
              </tr>
              <tr>
                <td className="text-[15px] text-[var(--ink-85)]">
                  CVR / AOV lift, early access
                </td>
                <td className={`${styles.serif} text-[1.35rem] font-semibold tabular-nums text-[var(--ink)]`}>
                  +<CountUp to={9} suffix="%" /> CVR / +<CountUp to={20} suffix="%" /> AOV
                </td>
                <td className="text-[13px] text-[var(--ink-40)] uppercase tracking-[0.06em]">
                  Bloomreach Loomi
                </td>
              </tr>
            </tbody>
          </table>
        </Reveal>
      </div>
    </section>
  );
}
