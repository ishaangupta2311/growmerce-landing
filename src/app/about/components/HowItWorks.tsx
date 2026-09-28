import Image from "next/image";
import { Brain, ChartLine, Check, Ear, Rocket, Search, User, type LucideIcon } from "lucide-react";
import Reveal from "@/components/site/Reveal";

/* The Figma draws each step's card as a flattened picture. Here the words are
   words and the little product scenes under them are drawn in markup, so they
   stay sharp and read to a screen reader as the text beside them. */

type Step = { n: string; icon: LucideIcon; title: string; body: string; scene: React.ReactNode };

function ListenScene() {
  return (
    <div aria-hidden className="relative h-full">
      <div className="space-y-2.5 rounded-[14px] bg-white p-3.5 ring-1 ring-line/70">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className="size-6 shrink-0 rounded-[6px] bg-charcoal/[0.06]" />
            <span className="h-2 flex-1 rounded-full bg-charcoal/[0.07]" style={{ maxWidth: `${88 - i * 12}%` }} />
          </div>
        ))}
      </div>
      <div className="absolute right-1 -bottom-1 left-6 flex items-end gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-charcoal text-white ring-2 ring-white">
          <User className="size-4" strokeWidth={2} />
        </span>
        <p className="rounded-[12px] rounded-bl-[4px] bg-peach px-3 py-2 text-[12.5px] leading-snug font-medium text-charcoal shadow-[0_12px_24px_-16px_rgba(255,90,31,0.6)]">
          Search relevance is our biggest issue
        </p>
      </div>
    </div>
  );
}

function BuildScene() {
  return (
    <div aria-hidden className="rounded-[14px] bg-white p-3.5 ring-1 ring-line/70">
      <p className="text-[13px] font-bold text-charcoal">Growsearch</p>
      <div className="mt-2.5 flex items-center gap-2 rounded-[8px] bg-cream py-1.5 pr-1.5 pl-2.5">
        <Search className="size-3.5 text-muted" strokeWidth={2} />
        <span className="h-1.5 flex-1 rounded-full bg-charcoal/[0.08]" />
        <span className="grid size-6 place-items-center rounded-[6px] bg-brand text-white">
          <Search className="size-3" strokeWidth={2.5} />
        </span>
      </div>
      <div className="mt-3 flex flex-col items-start gap-1.5">
        {["Intent understanding", "Zero-result recovery", "Smart ranking"].map((chip) => (
          <span key={chip} className="rounded-[7px] bg-peach px-2.5 py-1 text-[11.5px] font-semibold text-brand">
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

function InstallScene() {
  return (
    <div aria-hidden className="rounded-[14px] bg-white p-3.5 ring-1 ring-line/70">
      <div className="flex items-center gap-2">
        <span className="grid size-11 shrink-0 place-items-center rounded-[10px] bg-[#eef6e7]">
          <Image src="/img/logos/shopify-bag.svg" alt="" width={64} height={74} className="h-6 w-auto" />
        </span>
        <span className="h-px flex-1 border-t border-dashed border-brand/50" />
        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#2b9a5e] text-white">
          <Check className="size-3" strokeWidth={3} />
        </span>
        <span className="h-px flex-1 border-t border-dashed border-brand/50" />
        <span className="grid size-11 shrink-0 place-items-center rounded-[10px] bg-peach">
          <Image src="/brand/mark.svg" alt="" width={100} height={100} className="size-7" />
        </span>
      </div>
      <div className="mt-3 rounded-[10px] bg-[#e7f6ee] px-3 py-2.5 text-center">
        <p className="text-[12.5px] font-bold text-charcoal">Successfully installed</p>
        <p className="mt-0.5 text-[11.5px] text-body-mute">Growsearch is live in your store</p>
      </div>
    </div>
  );
}

function ImproveScene() {
  return (
    <div aria-hidden className="rounded-[14px] bg-white p-3.5 ring-1 ring-line/70">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-semibold text-charcoal">Impact over time</p>
        <span className="rounded-[5px] bg-cream px-1.5 py-0.5 text-[10px] text-body-mute">Last 30 days</span>
      </div>
      <svg viewBox="0 0 200 70" className="mt-2 h-16 w-full" fill="none">
        <path d="M2 62 C 30 58, 40 50, 62 52 S 100 40, 120 38 S 160 30, 198 6" stroke="#ff5a1f" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <p className="mt-1 text-[11px] text-body-mute">Search driven revenue</p>
      <p className="flex items-baseline gap-1.5">
        <span className="text-[18px] font-extrabold text-charcoal">$86,420</span>
        <span className="text-[11px] font-bold text-[#2b9a5e]">&#9650; 32.1%</span>
      </p>
    </div>
  );
}

const STEPS: Step[] = [
  {
    n: "01",
    icon: Ear,
    title: "Listen first",
    body: "We start by understanding where ecommerce teams lose time, customers, and opportunities.",
    scene: <ListenScene />,
  },
  {
    n: "02",
    icon: Brain,
    title: "Build what matters",
    body: "We create focused AI tools designed around real store problems — not generic features.",
    scene: <BuildScene />,
  },
  {
    n: "03",
    icon: Rocket,
    title: "Install seamlessly",
    body: "Your store keeps running while our tools integrate into your existing workflow.",
    scene: <InstallScene />,
  },
  {
    n: "04",
    icon: ChartLine,
    title: "Improve continuously",
    body: "We learn from real usage patterns and keep improving the experience for your store and your customers.",
    scene: <ImproveScene />,
  },
];

export default function HowItWorks() {
  return (
    <section aria-labelledby="sequence-title" className="mx-auto max-w-[1370px] px-6 py-16 lg:py-24">
      <Reveal className="text-center">
        <p className="mx-auto w-fit rounded-[10px] bg-peach px-5 py-1.5 text-[clamp(1.125rem,2vw,1.75rem)] font-bold text-brand">
          The Sequence
        </p>
        <h2
          id="sequence-title"
          className="mt-5 text-[clamp(2.25rem,6vw,5.25rem)] leading-[1.02] font-extrabold tracking-tight"
        >
          How Growmerce works
        </h2>
        <p className="mx-auto mt-5 max-w-[46ch] text-[clamp(1.0625rem,2vw,1.75rem)] leading-snug font-light text-charcoal">
          We don&rsquo;t build AI. We identify real ecommerce problems and build
          focused tools that solve them.
        </p>
      </Reveal>

      {/* Each step spans five rows of the list's grid — marker, title, rule,
          text, scene — and passes them down as a subgrid, so a title that
          wraps pushes that row down in every card, not just its own, and the
          rules, text and scenes stay level across the row. */}
      <ol className="mt-14 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-7">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <li key={step.n} className="row-span-5 grid grid-rows-subgrid">
              <Reveal delay={i * 90} className="row-span-5 grid grid-rows-subgrid">
              {/* Number and icon, joined to the next step by an arrow on
                  the row layout only. */}
              <div className="relative flex flex-col items-center pb-6">
                <span className="grid size-12 place-items-center rounded-full bg-brand text-[20px] font-extrabold text-white">
                  {step.n}
                </span>
                <span className="mt-3 grid size-32 place-items-center rounded-full bg-peach text-brand">
                  <Icon aria-hidden className="size-16" strokeWidth={1.6} />
                </span>
                {i < STEPS.length - 1 ? (
                  <span
                    aria-hidden
                    className="absolute top-[124px] left-[calc(50%+76px)] hidden h-0.5 w-[calc(100%-152px+28px)] bg-brand/35 lg:block"
                  >
                    <span className="absolute top-1/2 right-0 size-0 -translate-y-1/2 border-y-[7px] border-l-[11px] border-y-transparent border-l-brand/60" />
                  </span>
                ) : null}
              </div>

              <article className="row-span-4 mb-6 grid grid-rows-subgrid rounded-[26px] bg-white px-6 pt-7 pb-6 shadow-[0_24px_60px_-36px_rgba(73,28,8,0.35)]">
                <h3 className="self-end text-center text-[clamp(1.125rem,1.5vw,1.375rem)] font-bold text-charcoal text-balance">
                  {step.title}
                </h3>
                <span aria-hidden className="mx-auto mt-3 block h-0.5 w-14 rounded-full bg-brand/70" />
                <p className="mt-4 text-[16px] leading-relaxed text-body-mute">{step.body}</p>
                <div className="pt-7">{step.scene}</div>
              </article>
              </Reveal>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
