import Reveal from "@/components/site/Reveal";
import CtaPair from "@/components/site/CtaPair";
import { GROWSEARCH_HOME } from "@/lib/site-urls";

export default function ClosingCta() {
  return (
    <section className="mx-auto max-w-[1370px] px-6 py-20">
      <Reveal>
        <div className="rounded-[40px] bg-peach px-8 py-14 text-center sm:px-14">
          <h2 className="text-[clamp(2rem,4vw,3rem)] leading-[1.15] font-bold text-charcoal">
            See what it costs to stop losing searches
          </h2>
          <p className="mx-auto mt-4 max-w-[52ch] text-[17px] leading-relaxed text-body-mute">
            Every plan includes a 15-day free trial, no credit card
            required. Compare tiers and pick the one that fits your
            catalogue.
          </p>
          <CtaPair
            className="mt-8 justify-center"
            primaryHref="/pricing"
            primaryLabel="Get started"
            secondaryHref={GROWSEARCH_HOME}
            secondaryLabel="Back to Growsearch"
          />
        </div>
      </Reveal>
    </section>
  );
}
