import styles from "../ledger.module.css";
import Reveal from "@/components/site/Reveal";

const PRINCIPLES = [
  {
    no: "01",
    title: "Ship fast",
    body: "Working software beats a polished roadmap. We’d rather a merchant use something imperfect today than wait for something perfect next quarter.",
  },
  {
    no: "02",
    title: "Validate with paying customers",
    body: "From day one, not after a raise. A tool earns its place in the lineup by being worth paying for, not by fitting a pitch deck.",
  },
  {
    no: "03",
    title: "Workflow depth over feature breadth",
    body: "One job, done completely, beats ten half-built ones. Every tool we ship is scoped to do a single job well.",
  },
  {
    no: "04",
    title: "Install today, don’t migrate",
    body: "Tools that fit the stack a store already runs — not a platform that asks them to rebuild around us.",
  },
];

export default function Doctrine() {
  return (
    <section id="principles" className="scroll-mt-20 border-b border-[var(--ink-15)]">
      <div className="mx-auto max-w-[1180px] px-6 py-20 sm:px-10 sm:py-28">
        <Reveal>
          <div className="flex items-baseline justify-between gap-6">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-brand uppercase">
              § 03 · Doctrine
            </p>
            <div className="draw-line h-px flex-1 bg-[var(--ink-15)]" />
          </div>
          <h2 className={`${styles.serif} mt-6 max-w-[24ch] text-[2rem] leading-[1.12] font-semibold sm:text-[2.6rem]`}>
            How we build.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-x-12 gap-y-14 sm:grid-cols-2">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.no} delay={80 * i}>
              <div className="border-t border-[var(--ink-15)] pt-6">
                <span className={`${styles.serif} block text-[2.75rem] leading-none text-[var(--ink-15)]`}>
                  {p.no}
                </span>
                <h3 className="mt-3 text-[19px] font-semibold text-[var(--ink)]">{p.title}</h3>
                <p className={`${styles.serif} mt-3 max-w-[42ch] text-[15px] leading-relaxed text-[var(--ink-55)] italic`}>
                  {p.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120} className="mt-16 border-t border-[var(--ink-15)] pt-6">
          <p className="text-[13px] font-semibold tracking-[0.14em] text-[var(--ink-40)] uppercase">
            Founder-led · Built in public · Delhi-based, serving global ecommerce
          </p>
        </Reveal>
      </div>
    </section>
  );
}
