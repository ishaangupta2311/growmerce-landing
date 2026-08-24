import Link from "next/link";
import Reveal from "@/components/site/Reveal";

type Tier = {
  name: string;
  monthly: number;
  yearly: number;
  yearlyNote: string;
  searches: string;
  featured?: boolean;
};

const TIERS: Tier[] = [
  { name: "Basic", monthly: 49, yearly: 499, yearlyNote: "save 15%", searches: "5,000" },
  {
    name: "Plus",
    monthly: 99,
    yearly: 1090,
    yearlyNote: "save 7%",
    searches: "25,000",
    featured: true,
  },
  { name: "Pro", monthly: 199, yearly: 2199, yearlyNote: "save 8%", searches: "100,000" },
];

/* Six feature rows shared with /pricing. "Searches per month" is the only
   row that varies by tier — see `searches` above; the rest are included on
   every plan. */
const FEATURES = [
  "Built-in AI shopping assistant",
  "Handle natural language search queries",
  "Auto-sync search bar look to store theme",
  "Add products to cart directly in search",
  "AI answers user queries in search bar",
];

function Check() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="mt-0.5 shrink-0 text-brand"
    >
      <path
        d="m5 12.5 4.5 4.5L19 7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PricingPreview() {
  return (
    <section className="mx-auto max-w-[1370px] px-6 py-24">
      <Reveal>
        <span className="inline-flex rounded-full bg-brand px-6 py-1 text-lg font-medium text-white">
          Pricing
        </span>
        <h2 className="mt-4 text-[clamp(1.75rem,4vw,3.25rem)] leading-[1.1] font-bold">
          Offers on Growsearch
        </h2>
        <p className="mt-3 max-w-[60ch] text-[17px] leading-relaxed text-body-mute">
          A simple monthly number for every plan, with a lower price if you
          pay yearly. Every plan starts with a 15-day free trial — no credit
          card required.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {TIERS.map((tier, i) => (
          <Reveal key={tier.name} delay={i * 100}>
            <article
              className={`flex h-full flex-col rounded-[27px] p-7 ${
                tier.featured
                  ? "bg-charcoal text-white shadow-glow-lg"
                  : "border border-line bg-white shadow-glow"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">{tier.name}</h3>
                {tier.featured ? (
                  <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
                    Most popular
                  </span>
                ) : null}
              </div>

              <p className="mt-5">
                <span className="text-4xl font-bold">${tier.monthly}</span>
                <span
                  className={
                    tier.featured ? "text-white/70" : "text-muted"
                  }
                >
                  {" "}
                  /mo
                </span>
              </p>
              <p
                className={`mt-1 text-sm ${tier.featured ? "text-white/70" : "text-muted"}`}
              >
                or ${tier.yearly.toLocaleString()}/yr · {tier.yearlyNote}
              </p>

              <ul className="mt-6 space-y-3 text-[15px]">
                <li className="flex items-start gap-2.5">
                  <Check />
                  <span>
                    Upto{" "}
                    <span className="font-semibold">{tier.searches}</span>{" "}
                    searches per month
                  </span>
                </li>
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <p
                className={`mt-6 text-sm font-semibold ${tier.featured ? "text-white" : "text-brand"}`}
              >
                15 days free trial
              </p>

              <Link
                href="/pricing"
                className={`mt-6 w-full ${tier.featured ? "cta-primary-inverse" : "cta-primary"}`}
              >
                Start free trial
              </Link>
            </article>
          </Reveal>
        ))}
      </div>

      <p className="mt-8 text-[15px] text-body-mute">
        See the full feature comparison and annual pricing on the{" "}
        <Link href="/pricing" className="font-semibold text-brand hover:underline">
          pricing page
        </Link>
        .
      </p>
    </section>
  );
}
