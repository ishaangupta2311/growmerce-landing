import { Footprints, Headphones, Search, ShoppingBag, Target } from "lucide-react";
import Reveal from "@/components/site/Reveal";

/* A storefront search window, a magnifier and a rising chart — the Figma's
   illustration, drawn rather than pasted so it stays sharp. Decorative: the
   heading beside it says the same thing. */
function StoreScene() {
  return (
    <div aria-hidden className="relative hidden h-[180px] w-[440px] shrink-0 lg:block">
      <div className="absolute top-2 left-14 w-[270px] rounded-[16px] bg-white/80 p-3 shadow-[0_24px_50px_-28px_rgba(255,90,31,0.55)] ring-1 ring-brand/15">
        <div className="flex gap-1.5 pb-2.5">
          <span className="size-1.5 rounded-full bg-brand/70" />
          <span className="size-1.5 rounded-full bg-brand/35" />
          <span className="size-1.5 rounded-full bg-brand/35" />
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 ring-1 ring-brand/15">
          <Search className="size-3.5 text-brand" strokeWidth={2.4} />
          <span className="h-1.5 w-16 rounded-full bg-brand/25" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[Footprints, ShoppingBag, Headphones].map((Icon, i) => (
            <span key={i} className="grid aspect-square place-items-center rounded-[10px] bg-peach/70 text-brand">
              <Icon className="size-7" strokeWidth={1.6} />
            </span>
          ))}
        </div>
      </div>
      <Search className="absolute bottom-0 left-0 size-24 text-brand" strokeWidth={2.2} />
      <div className="absolute top-8 right-0 w-[120px] rounded-[14px] bg-white/75 p-3 ring-1 ring-brand/15">
        <svg viewBox="0 0 100 60" className="h-16 w-full" fill="none">
          <path d="M4 52 L28 34 L44 42 L66 20 L84 28 L96 8" stroke="#ff5a1f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M88 8 H96 V16" stroke="#ff5a1f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

export default function BuiltForEcommerce() {
  return (
    <Reveal className="mx-auto max-w-[1370px] px-6">
      <div className="flex items-center gap-6 overflow-hidden rounded-[26px] bg-[linear-gradient(100deg,#fff6f1,#ffe9de)] px-6 py-8 sm:gap-10 sm:px-10 lg:py-6">
        <span className="grid size-20 shrink-0 place-items-center rounded-full bg-white/70 text-brand shadow-[0_0_0_14px_rgba(255,90,31,0.06)] sm:size-24">
          <Target aria-hidden className="size-10 sm:size-12" strokeWidth={2} />
        </span>
        <span aria-hidden className="hidden h-24 w-px bg-brand/25 sm:block" />
        <h2 className="flex-1 text-[clamp(1.5rem,3vw,2.75rem)] leading-[1.12] font-extrabold tracking-tight text-charcoal">
          Built for <span className="text-brand">ecommerce</span>,
          <br />
          not generic AI.
        </h2>
        <StoreScene />
      </div>
    </Reveal>
  );
}
