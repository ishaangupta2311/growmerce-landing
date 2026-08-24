"use client";

import { useState } from "react";
import Arrow from "./Arrow";

/* The capture band from Figma: we do the first hour of work before the call. */
export default function ProveItBand({ className }: { className?: string }) {
  const [sent, setSent] = useState(false);
  const [url, setUrl] = useState("");

  return (
    <section
      aria-labelledby="prove-it-title"
      className={`mx-auto max-w-[1370px] px-6 py-20 lg:py-24 ${className ?? ""}`}
    >
      <div className="rounded-[36px] bg-cream px-7 py-12 sm:px-12 lg:px-16 lg:py-16">
        <p className="font-poppins text-[13px] font-bold tracking-[0.18em] text-brand uppercase">
          Before we ever talk
        </p>
        <h2
          id="prove-it-title"
          className="mt-4 max-w-[20ch] text-[clamp(2rem,4.6vw,4.25rem)] leading-[1.05] font-extrabold tracking-tight text-balance"
        >
          Skip the call. We&rsquo;ll do the first hour of work
        </h2>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-end">
          <p className="max-w-[52ch] text-[clamp(1rem,1.4vw,1.375rem)] leading-relaxed text-body-mute">
            Drop your store URL. We&rsquo;ll send back the three workflows most
            likely costing you hours, what each is worth to fix, and how
            we&rsquo;d scope the first one.
          </p>

          {sent ? (
            <p
              role="status"
              className="rounded-2xl bg-white px-6 py-5 text-[15.5px] font-semibold text-charcoal ring-1 ring-brand/25"
            >
              Thanks — we&rsquo;ll be in touch with your teardown shortly.
            </p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (url.trim()) setSent(true);
              }}
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <label htmlFor="store-url" className="sr-only">
                Your store URL
              </label>
              <input
                id="store-url"
                name="store-url"
                type="text"
                inputMode="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="yourstore.com"
                className="min-w-0 flex-1 rounded-full border border-line bg-white px-6 py-3.5 text-[16px] text-charcoal placeholder:text-muted focus:border-brand focus:outline-none"
              />
              <button
                type="submit"
                className="cta-primary shrink-0"
              >
                Okay, prove it
                <Arrow className="size-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
