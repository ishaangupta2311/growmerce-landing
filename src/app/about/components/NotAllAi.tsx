import { Check } from "lucide-react";
import Reveal from "@/components/site/Reveal";

/* What other tools promise, struck through, against what we do instead. The
   Figma also pairs "Free trial" with "Every engagement is paid"; Growsearch
   has a free 15-day trial, so that pair is left out rather than published
   against the site's own "Try it free". */
const THEIRS = ["AI for your entire store", "Fully autonomous", "Works out of the box", "Replaces your team"];

const OURS = [
  "We take one job and finish it",
  "A person checks anything expensive to get wrong",
  "It learns your rules first, then works",
  "Your team stays. We take the grunt work",
];

export default function NotAllAi() {
  return (
    <section aria-labelledby="not-all-title" className="bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-[1370px] px-6">
        <Reveal>
          <h2
            id="not-all-title"
            className="text-center text-[clamp(1.875rem,3.6vw,3rem)] font-extrabold tracking-tight"
          >
            Not all ecommerce AI is the same
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <div className="mx-auto mt-10 grid max-w-[1240px] overflow-hidden rounded-[16px] ring-1 ring-line md:grid-cols-2">
            <div className="bg-[#f3f3f2] px-7 py-7">
              <p className="sr-only">What other tools promise</p>
              <ul className="space-y-5">
                {THEIRS.map((claim) => (
                  <li key={claim} className="text-[16px] text-muted line-through decoration-muted/80">
                    &ldquo;{claim}&rdquo;
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-charcoal px-7 py-7 text-white">
              <p className="sr-only">What Growmerce does instead</p>
              <ul className="space-y-5">
                {OURS.map((line) => (
                  <li key={line} className="flex items-start gap-4 text-[16px]">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={3} />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
