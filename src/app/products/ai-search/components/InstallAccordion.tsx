"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { Check, ChevronDown, RefreshCw, Search, Shirt, Sparkles, Watch, Footprints } from "lucide-react";
import Reveal from "@/components/site/Reveal";

/* The Figma drafts three rows, every one titled "Quick and easy installation"
   over a competitor's paragraph, beside an empty grey square. These say how
   the app actually goes in, and the square shows the row that is open. */

function InstallScene() {
  return (
    <div className="w-[min(100%,380px)] rounded-[20px] bg-white p-5 shadow-[0_30px_60px_-36px_rgba(73,28,8,0.5)] ring-1 ring-line/70">
      <div className="flex items-center gap-3">
        <span className="grid size-14 shrink-0 place-items-center rounded-[14px] bg-[#eef6e7]">
          <Image src="/img/logos/shopify-bag.svg" alt="" width={64} height={74} className="h-8 w-auto" />
        </span>
        <span className="h-px flex-1 border-t-2 border-dashed border-brand/40" />
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#2b9a5e] text-white">
          <Check className="size-4" strokeWidth={3} />
        </span>
        <span className="h-px flex-1 border-t-2 border-dashed border-brand/40" />
        <span className="grid size-14 shrink-0 place-items-center rounded-[14px] bg-peach">
          <Image src="/brand/mark.svg" alt="" width={100} height={100} className="size-9" />
        </span>
      </div>
      <div className="mt-5 rounded-[12px] bg-[#e7f6ee] px-4 py-3">
        <p className="text-[15px] font-bold text-charcoal">Installed</p>
        <p className="mt-0.5 text-[13px] text-body-mute">Search is live on your store</p>
      </div>
      <div className="mt-3 flex gap-2 text-[12px] font-semibold text-body-mute">
        {["No developer", "No migration", "No code"].map((tag) => (
          <span key={tag} className="rounded-full bg-cream px-2.5 py-1">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

const PRODUCTS = [
  { icon: Shirt, name: "Linen shirt", note: "Price updated", price: "$29.99" },
  { icon: Footprints, name: "Trail runner", note: "Back in stock", price: "$84.00" },
  { icon: Watch, name: "Field watch", note: "New arrival", price: "$129.00" },
];

function SyncScene() {
  return (
    <div className="w-[min(100%,380px)] rounded-[20px] bg-white p-5 shadow-[0_30px_60px_-36px_rgba(73,28,8,0.5)] ring-1 ring-line/70">
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-bold text-charcoal">Your catalogue</p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e7f6ee] px-2.5 py-1 text-[12px] font-bold text-[#2b9a5e]">
          <RefreshCw className="size-3.5" strokeWidth={2.6} />
          In sync
        </span>
      </div>
      <ul className="mt-4 space-y-2.5">
        {PRODUCTS.map(({ icon: Icon, name, note, price }) => (
          <li key={name} className="flex items-center gap-3 rounded-[12px] bg-cream/70 p-2.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-peach text-brand">
              <Icon className="size-5" strokeWidth={1.8} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold text-charcoal">{name}</span>
              <span className="block text-[12px] text-brand">{note}</span>
            </span>
            <span className="text-[14px] font-bold text-charcoal">{price}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const SWATCHES = ["#ff5a1f", "#1f3a5f", "#2b9a5e", "#171717"];

function ThemeScene() {
  return (
    <div className="w-[min(100%,380px)] rounded-[20px] bg-white p-5 shadow-[0_30px_60px_-36px_rgba(73,28,8,0.5)] ring-1 ring-line/70">
      <div className="flex items-center justify-between">
        <span className="h-2.5 w-16 rounded-full bg-charcoal/15" />
        <span className="flex gap-2">
          <span className="h-2 w-8 rounded-full bg-charcoal/10" />
          <span className="h-2 w-8 rounded-full bg-charcoal/10" />
          <span className="h-2 w-8 rounded-full bg-charcoal/10" />
        </span>
      </div>
      <div className="mt-5 flex items-center gap-2 rounded-full bg-white py-1.5 pr-1.5 pl-4 ring-2 ring-[#1f3a5f]">
        <Sparkles className="size-4 text-[#1f3a5f]" strokeWidth={2} />
        <span className="flex-1 text-[13px] text-body-mute">Describe what you&rsquo;re looking for</span>
        <span className="grid size-8 place-items-center rounded-full bg-[#1f3a5f] text-white">
          <Search className="size-4" strokeWidth={2.4} />
        </span>
      </div>
      <div className="mt-5 flex items-center justify-between rounded-[12px] bg-cream/70 px-4 py-3">
        <span className="text-[13px] font-semibold text-charcoal">Theme colour</span>
        <span className="flex gap-2">
          {SWATCHES.map((c) => (
            <span
              key={c}
              className={`size-6 rounded-full ${c === "#1f3a5f" ? "ring-2 ring-offset-2 ring-[#1f3a5f]" : ""}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

const ITEMS = [
  {
    title: "Quick and easy installation",
    body: "Up and running in minutes. It installs as a Shopify app in a couple of clicks: no developer, no replatforming, and your theme stays as it is.",
    scene: <InstallScene />,
  },
  {
    title: "Your catalogue stays in sync",
    body: "Products index themselves the moment it's installed, and stay current as prices, stock and new arrivals change. There is nothing to upload or re-import.",
    scene: <SyncScene />,
  },
  {
    title: "Matches your store's look",
    body: "The search bar picks up your theme's colours on install. Adjust the colours and where it sits any time in the Shopify theme editor.",
    scene: <ThemeScene />,
  },
];

export default function InstallAccordion() {
  const [open, setOpen] = useState(0);
  const id = useId();

  return (
    <section aria-labelledby="install-title" className="mx-auto max-w-[1370px] px-6 pb-24">
      <Reveal className="grid items-center gap-10 rounded-[32px] bg-white p-4 ring-1 ring-line/70 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14 lg:p-14">
        <div>
          <p className="section-eyebrow">Setup</p>
          <h2
            id="install-title"
            className="mt-3 text-[clamp(1.875rem,3.2vw,2.75rem)] leading-[1.08] font-extrabold tracking-tight text-charcoal"
          >
            Live on your store in <span className="text-brand">minutes</span>
          </h2>

          <ul className="mt-8 space-y-2">
            {ITEMS.map((item, i) => {
              const isOpen = open === i;
              return (
                <li
                  key={item.title}
                  className={`rounded-[18px] transition-colors duration-200 ${isOpen ? "bg-cream ring-1 ring-brand/15" : "hover:bg-cream/60"}`}
                >
                  <h3>
                    <button
                      type="button"
                      id={`${id}-t${i}`}
                      aria-expanded={isOpen}
                      aria-controls={`${id}-p${i}`}
                      onClick={() => setOpen(i)}
                      className="flex w-full items-center gap-4 rounded-[18px] px-5 py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      <span
                        className={`grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-bold transition-colors ${isOpen ? "bg-brand text-white" : "bg-peach text-brand"}`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1 text-[clamp(1.0625rem,1.5vw,1.3125rem)] font-bold text-charcoal">
                        {item.title}
                      </span>
                      <ChevronDown
                        aria-hidden
                        className={`size-5 shrink-0 text-body-mute transition-transform duration-200 ${isOpen ? "rotate-180 text-brand" : ""}`}
                        strokeWidth={2.2}
                      />
                    </button>
                  </h3>
                  <div
                    id={`${id}-p${i}`}
                    role="region"
                    aria-labelledby={`${id}-t${i}`}
                    hidden={!isOpen}
                    className="px-5 pb-5 sm:pl-[4.5rem]"
                  >
                    <p className="text-[15px] leading-relaxed text-body-mute">{item.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Every scene is drawn in the same cell and only the open row's is
            shown, so the panel never changes height as the rows switch. */}
        <div
          aria-hidden
          className="grid min-h-[340px] place-items-center overflow-hidden rounded-[24px] bg-[linear-gradient(140deg,#fff6f1,#ffe4d6)] p-4 sm:min-h-[420px]"
        >
          {ITEMS.map((item, i) => (
            <div
              key={item.title}
              className={`col-start-1 row-start-1 flex w-full justify-center transition-[opacity,transform] duration-300 ${open === i ? "opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`}
            >
              {item.scene}
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
