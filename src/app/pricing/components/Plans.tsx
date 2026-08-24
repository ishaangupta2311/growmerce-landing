"use client";

import Link from "next/link";
import { useState } from "react";

type Plan = {
  name: string;
  monthly: number;
  yearly: number;
  savePct: number;
  searches: string;
  featured?: boolean;
};

const PLANS: Plan[] = [
  { name: "Basic", monthly: 49, yearly: 499, savePct: 15, searches: "Upto 5,000 searches per month" },
  { name: "Plus", monthly: 99, yearly: 1090, savePct: 7, searches: "Upto 25,000 searches per month", featured: true },
  { name: "Pro", monthly: 199, yearly: 2199, savePct: 8, searches: "Upto 100,000 searches per month" },
];

/* Shared across every tier in Figma; only the search allowance differs. */
const SHARED = [
  "Built-in AI shopping assistant",
  "Handle natural language search queries",
  "Auto-sync search bar look to store theme",
  "Add products to cart directly in search",
  "AI answers user queries in search bar",
];

function Tick() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="mt-0.5 shrink-0">
      <path d="m4 12.5 5.5 5.5L20 6.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Plans() {
  const [yearly, setYearly] = useState(false);

  return (
    <section aria-labelledby="plans-title" className="mx-auto max-w-[1370px] px-6 pt-16">
      <h2 id="plans-title" className="sr-only">
        Growsearch plans
      </h2>

      {/* Billing toggle */}
      <div className="flex justify-center">
        <div
          role="group"
          aria-label="Billing period"
          className="inline-flex items-center gap-1 rounded-full border border-line bg-white p-1.5 shadow-[0_10px_30px_-18px_rgba(23,23,23,0.35)]"
        >
          {[
            { label: "Monthly", value: false },
            { label: "Yearly", value: true },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              aria-pressed={yearly === opt.value}
              onClick={() => setYearly(opt.value)}
              className={`rounded-full px-8 py-2.5 font-poppins text-[clamp(1rem,1.5vw,1.375rem)] transition-colors duration-200 ${
                yearly === opt.value
                  ? "bg-brand font-bold text-white"
                  : "font-medium text-charcoal hover:text-brand"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <article
            key={plan.name}
            className={`flex flex-col overflow-hidden rounded-[20px] bg-white ring-1 transition-transform duration-300 hover:-translate-y-1 ${
              plan.featured
                ? "ring-2 ring-brand shadow-[0_28px_60px_-34px_rgba(255,90,31,0.75)]"
                : "ring-line shadow-[0_18px_40px_-30px_rgba(23,23,23,0.4)]"
            }`}
          >
            <div className="flex-1 p-7">
              <div className="flex items-center justify-between gap-3">
                <p className="font-poppins text-[17px] font-semibold text-body-mute">
                  {plan.name}
                </p>
                {plan.featured ? (
                  <span className="rounded-full bg-peach px-3 py-1 text-[11px] font-extrabold tracking-[0.12em] text-brand uppercase">
                    Most picked
                  </span>
                ) : null}
              </div>

              <p className="mt-2 font-poppins text-[clamp(1.75rem,3vw,2.25rem)] leading-none font-extrabold">
                ${yearly ? plan.yearly.toLocaleString() : plan.monthly}
                <span className="ml-1 align-middle text-[15px] font-semibold text-muted">
                  / {yearly ? "year" : "month"}
                </span>
              </p>
              <p className="mt-2 text-[14.5px] font-semibold text-brand">
                {yearly
                  ? `save ${plan.savePct}% vs monthly`
                  : `or $${plan.yearly.toLocaleString()}/ year and save ${plan.savePct}%`}
              </p>

              <p className="mt-6 text-[clamp(1.0625rem,1.5vw,1.5rem)] font-semibold">
                Features
              </p>
              <ul className="mt-3 space-y-2.5 text-[15px] font-medium text-charcoal">
                <li className="flex gap-2.5">
                  <Tick />
                  {plan.searches}
                </li>
                {SHARED.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Tick />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-line bg-[#f5f5f5] px-7 py-4">
              <p className="text-[14px] font-semibold">15 days free trial</p>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-6 text-center text-[15px] text-muted">
        Every plan includes a 15-day free trial. No credit card required, no
        revenue share, cancel whenever you like.{" "}
        <Link href="/growsearch" className="font-semibold text-brand underline">
          See what Growsearch does
        </Link>
        .
      </p>
    </section>
  );
}
