import {
  ChartColumn,
  ChartLine,
  CircleX,
  FileText,
  Search,
  ShoppingBag,
  Sparkle,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";
import Reveal from "@/components/site/Reveal";

const STATS: { icon: LucideIcon; figure: string; label: string; body: string }[] = [
  { icon: Search, figure: "68%", label: "Lost Searches", body: "Customers leave when they can’t find products" },
  { icon: TrendingDown, figure: "42%", label: "Missed Revenue", body: "Lost due to poor discovery" },
  { icon: ChartColumn, figure: "3x", label: "Better Discovery", body: "More opportunities with smarter search" },
];

type Flow = { icon: LucideIcon; label: string }[];

const OLD_SEARCH: Flow = [
  { icon: Search, label: "Keyword match" },
  { icon: FileText, label: "Exact results" },
  { icon: CircleX, label: "Missed products" },
];

const GROWMERCE_AI: Flow = [
  { icon: Sparkle, label: "Understand intent" },
  { icon: ShoppingBag, label: "Relevant products" },
  { icon: ChartLine, label: "Better discovery" },
];

function FlowColumn({ flow, tone }: { flow: Flow; tone: "old" | "new" }) {
  const old = tone === "old";
  return (
    <ol className={`flex flex-col items-center px-4 pt-6 pb-8 ${old ? "" : "bg-peach/40"}`}>
      {flow.map((step, i) => {
        const Icon = step.icon;
        return (
          <li key={step.label} className="flex flex-col items-center">
            {i > 0 ? (
              <span aria-hidden className={`my-3 flex flex-col items-center ${old ? "text-muted" : "text-brand"}`}>
                <span className="h-8 border-l-2 border-dashed border-current opacity-60" />
                <span className="size-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-current" />
              </span>
            ) : null}
            <span
              className={`grid size-[clamp(4rem,6vw,5.5rem)] place-items-center rounded-full bg-white shadow-[0_16px_34px_-22px_rgba(23,23,23,0.45)] ${old ? "text-charcoal" : "text-brand"}`}
            >
              <Icon aria-hidden className="size-[42%]" strokeWidth={1.8} />
            </span>
            <span className="mt-3 text-center text-[clamp(0.95rem,1.3vw,1.125rem)] font-semibold text-charcoal">
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function WhyExists() {
  return (
    <section aria-labelledby="why-title" className="mx-auto max-w-[1370px] px-6 py-16 lg:py-20">
      <Reveal className="text-center">
        <p className="mx-auto w-fit rounded-[10px] bg-peach px-5 py-1.5 text-[clamp(1.125rem,2vw,1.75rem)] font-bold text-brand">
          Why Growmerce exists
        </p>
      </Reveal>

      <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-10">
        <Reveal>
          <h2
            id="why-title"
            className="text-[clamp(2.25rem,5vw,4.5rem)] leading-[1.05] font-extrabold tracking-tight"
          >
            Ecommerce changed.
            <br />
            <span className="text-brand">Search didn&rsquo;t.</span>
          </h2>
          <p className="mt-6 max-w-[34ch] text-[clamp(1.0625rem,1.9vw,1.75rem)] leading-snug font-light text-charcoal">
            Customers search differently today. Growmerce helps stores understand
            intent and create better product discovery.
          </p>

          <ul className="mt-10 grid gap-4 sm:grid-cols-3">
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <li
                  key={stat.label}
                  className="flex flex-col items-center rounded-[22px] bg-white px-4 pt-6 pb-6 text-center shadow-[0_24px_60px_-40px_rgba(73,28,8,0.4)]"
                >
                  <span className="grid size-16 place-items-center rounded-full bg-peach text-brand">
                    <Icon aria-hidden className="size-7" strokeWidth={1.8} />
                  </span>
                  <p className="mt-5 text-[clamp(2.25rem,3.4vw,3.25rem)] leading-none font-extrabold text-brand">
                    {stat.figure}
                  </p>
                  <p className="mt-3 text-[17px] font-bold text-charcoal">{stat.label}</p>
                  <span aria-hidden className="my-4 h-px w-4/5 bg-line" />
                  <p className="text-[14.5px] leading-snug text-body-mute">{stat.body}</p>
                </li>
              );
            })}
          </ul>
        </Reveal>

        <Reveal delay={120}>
          <figure
            aria-label="Old search compared with Growmerce AI"
            className="relative overflow-hidden rounded-[26px] bg-[#f7f7f7] shadow-[0_24px_60px_-40px_rgba(73,28,8,0.4)]"
          >
            <div className="grid grid-cols-2">
              <div className="flex justify-center px-4 pt-6">
                <span className="rounded-[10px] bg-charcoal/[0.07] px-2.5 py-1.5 text-[11px] sm:px-4 sm:py-2 sm:text-[clamp(0.8rem,1.1vw,1rem)] font-bold tracking-wide text-charcoal uppercase">
                  Old search
                </span>
              </div>
              <div className="flex justify-center bg-peach/40 px-4 pt-6">
                <span className="rounded-[10px] bg-brand px-2.5 py-1.5 text-[11px] sm:px-4 sm:py-2 sm:text-[clamp(0.8rem,1.1vw,1rem)] font-bold tracking-wide text-white uppercase">
                  Growmerce AI
                </span>
              </div>
              <FlowColumn flow={OLD_SEARCH} tone="old" />
              <FlowColumn flow={GROWMERCE_AI} tone="new" />
            </div>
            <span
              aria-hidden
              className="absolute top-5 left-1/2 grid size-9 -translate-x-1/2 place-items-center rounded-full bg-white text-[13px] sm:top-4 sm:size-14 sm:text-[18px] font-extrabold text-charcoal shadow-[0_10px_24px_-14px_rgba(23,23,23,0.45)]"
            >
              VS
            </span>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
