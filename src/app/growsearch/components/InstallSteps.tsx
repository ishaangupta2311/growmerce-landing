import Reveal from "@/components/site/Reveal";

/* Figma leaves the 01–04 step bodies empty ("How to install Growsearch with
   your website?"); written honestly from how the app actually installs. */
const STEPS = [
  {
    n: "01",
    title: "Install",
    body: "Add Growsearch from the Shopify App Store in a couple of clicks — no developer or replatform required.",
  },
  {
    n: "02",
    title: "Index",
    body: "Your catalogue indexes itself automatically from Shopify webhooks, and stays current as products, prices and stock change.",
  },
  {
    n: "03",
    title: "Match",
    body: "The search bar auto-matches your theme's look on install. Fine-tune colors and placement anytime in the theme editor.",
  },
  {
    n: "04",
    title: "Measure",
    body: "Watch search-attributed revenue, click-through rate and conversion show up in your dashboard from day one.",
  },
];

export default function InstallSteps() {
  return (
    <section className="mx-auto max-w-[1370px] px-6 pt-12 pb-24">
      <Reveal>
        <span className="inline-flex rounded-full bg-brand px-6 py-1 text-lg font-medium text-white">
          Growsearch AI
        </span>
        <h2 className="mt-4 max-w-[26ch] text-[clamp(1.75rem,4vw,3.25rem)] leading-[1.1] font-bold">
          How to install Growsearch with your website?
        </h2>
      </Reveal>

      <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {STEPS.map((step, i) => (
          <Reveal key={step.n} delay={i * 100}>
            <div className="relative border-l-2 border-brand/25 pl-6">
              <span className="font-grotesk text-4xl font-bold text-brand/30">
                {step.n}
              </span>
              <h3 className="mt-3 text-xl font-bold text-charcoal">
                {step.title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-body-mute">
                {step.body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
