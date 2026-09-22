import Reveal from "./Reveal";

const STEPS = [
  { number: "01", label: "Understand intent" },
  { number: "02", label: "Rank the right products" },
  { number: "03", label: "Measure revenue" },
];

export default function HomeIntro() {
  return (
    <section className="border-y border-brand/10 bg-cream/55 px-6 py-16 font-bricolage sm:py-20 lg:px-10 lg:py-24">
      <Reveal className="mx-auto max-w-[1160px]">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-20">
          <div>
            <p className="section-eyebrow">
              Built for ecommerce
            </p>
            <h2 className="section-title mt-4 max-w-[20ch]">
              Search that turns{" "}
              <span className="text-brand">intent into revenue.</span>
            </h2>
          </div>

          <p className="section-lede max-w-[48ch]">
            Growsearch understands what shoppers mean, ranks the right products,
            and shows which searches lead to sales.
          </p>
        </div>

        <ol className="mt-12 grid border-y border-brand/15 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.number}
              className={`flex items-center gap-4 py-5 sm:px-6 ${
                index > 0
                  ? "border-t border-brand/15 sm:border-t-0 sm:border-l"
                  : "sm:pl-0"
              } ${index === STEPS.length - 1 ? "sm:pr-0" : ""}`}
            >
              <span className="text-xs font-bold tracking-[0.14em] text-brand">
                {step.number}
              </span>
              <span className="text-[17px] font-semibold text-charcoal">
                {step.label}
              </span>
              {index < STEPS.length - 1 && (
                <span className="ml-auto hidden text-xl text-brand/45 sm:block" aria-hidden>
                  →
                </span>
              )}
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}
