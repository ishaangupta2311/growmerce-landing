import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import PlatformStrip from "@/components/site/PlatformStrip";
import TryForm from "./components/TryForm";

export const metadata: Metadata = {
  title: "Try it free",
  description:
    "Give us your store's domain and we'll draw Growsearch on your own storefront — your colours, your products, in about twenty seconds. No install, no card.",
};

/* These describe what the job actually does, and they have to keep doing so.
   Step one used to promise "your demo store opens in a new tab", left over from
   a version of this flow that hijacked a tab on submit. That behaviour was
   removed and the promise outlived it, so the first thing the page told a
   visitor was the one thing it no longer did. The demo store is still there —
   it is a card on the preview itself, opened when someone asks for it. */
const NEXT = [
  {
    n: "1",
    title: "We read your public storefront",
    body: "Colours, type, corner radius and a few of your products — all from the page a shopper already sees.",
  },
  {
    n: "2",
    title: "We photograph your search as it is today",
    body: "We open your own search box and take a picture of it. Nothing typed, nothing submitted, nothing changed.",
  },
  {
    n: "3",
    title: "Then we draw Growsearch on the same page",
    body: "Your palette, your products, answering a whole sentence. Flip between the two and see the difference.",
  },
];

export default function TryPage() {
  return (
    <>
      <Navbar />
      <main className="font-bricolage">
        <section className="mx-auto max-w-[1370px] px-6 pt-14 pb-16 lg:pt-20">
          <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-20">
            {/* Form column */}
            <div className="min-w-0">
              <p className="hero-enter font-poppins text-[13px] font-extrabold tracking-[0.18em] text-brand uppercase">
                &ndash; Free trial
              </p>
              <h1
                className="hero-enter mt-5 text-[clamp(2rem,5vw,3.75rem)] leading-[1.05] font-extrabold tracking-tight text-balance"
                style={{ animationDelay: "90ms" }}
              >
                See Growsearch{" "}
                <span className="text-brand">on your own store.</span>
              </h1>
              <p
                className="hero-enter mt-6 max-w-[50ch] text-[clamp(1.0625rem,1.6vw,1.25rem)] leading-relaxed text-body-mute"
                style={{ animationDelay: "170ms" }}
              >
                Tell us your domain and we&apos;ll read your storefront the way
                a shopper does &mdash; then draw the search your shoppers would
                get, in your own colours. It takes about twenty seconds.
              </p>

              <div
                className="hero-enter mt-9 rounded-[26px] border border-line bg-white p-7 shadow-[0_28px_70px_-50px_rgba(23,23,23,0.55)] sm:p-9"
                style={{ animationDelay: "250ms" }}
              >
                {/* TryForm reads `?store=` with useSearchParams, so it renders
                    on the client; the skeleton holds the card's height so the
                    page does not jump when it arrives. */}
                <Suspense
                  fallback={
                    <div aria-hidden className="animate-pulse space-y-5">
                      <div className="h-4 w-40 rounded bg-line" />
                      <div className="h-[54px] rounded-[10px] bg-cream" />
                      <div className="h-4 w-52 rounded bg-line" />
                      <div className="h-[54px] rounded-[10px] bg-cream" />
                      <div className="h-[52px] w-56 rounded-[10px] bg-cream" />
                    </div>
                  }
                >
                  <TryForm />
                </Suspense>
              </div>
            </div>

            {/* What happens next */}
            <div
              className="hero-enter min-w-0 lg:pt-14"
              style={{ animationDelay: "330ms" }}
            >
              <h2 className="font-poppins text-[13px] font-extrabold tracking-[0.18em] text-charcoal uppercase">
                What happens next
              </h2>
              <ol className="mt-7 space-y-7">
                {NEXT.map((item) => (
                  <li key={item.n} className="flex gap-5">
                    <span
                      aria-hidden
                      className="font-poppins grid size-10 shrink-0 place-items-center rounded-full bg-peach text-[16px] font-extrabold text-brand"
                    >
                      {item.n}
                    </span>
                    <div className="min-w-0">
                      <p className="font-poppins text-[17px] leading-snug font-bold text-charcoal">
                        {item.title}
                      </p>
                      <p className="mt-1.5 max-w-[42ch] text-[15px] leading-relaxed text-body-mute">
                        {item.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <p className="mt-9 max-w-[44ch] border-l-2 border-brand/30 pl-5 text-[14.5px] leading-relaxed text-body-mute">
                The preview is a mock-up. We read your public storefront and
                nothing else &mdash; no app to install, no theme edit, no
                access to your admin.
              </p>
            </div>
          </div>
        </section>

        <PlatformStrip />
      </main>
      <Footer />
    </>
  );
}
