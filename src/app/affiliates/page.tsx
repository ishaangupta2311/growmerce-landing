import type { Metadata } from "next";
import Link from "next/link";

import { DEFAULT_RATE_BPS, formatRate, HOLD_DAYS } from "@/lib/affiliate/commission";
import { optionalPartner } from "@/lib/affiliate/session";

export const metadata: Metadata = {
  title: "Affiliate program",
  description:
    "Refer stores to Growmerce and get paid. Agencies earn on every payment for as long as the store stays; creators earn a share of the first.",
};

/**
 * The public page. The only one on this surface a signed-out visitor is meant
 * to read, and the only one that has to sell anything.
 *
 * The two programs are set out side by side rather than blended into one
 * "earn up to 30%" claim. They are genuinely different offers — one pays every
 * month, one pays once — and an agency who signs up believing they get the
 * bigger number is a partner we have to disappoint later.
 *
 * The rates come from `commission.ts` rather than being typed in here, so the
 * page cannot end up advertising a rate the ledger does not pay.
 */
export default async function AffiliateProgramPage() {
  const session = await optionalPartner();

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 py-16 sm:px-8 sm:py-24">
      <p className="inline-block rounded-[7px] bg-peach px-3.5 py-2 font-poppins text-[13px] font-extrabold tracking-[0.02em] text-brand uppercase">
        Growmerce affiliates
      </p>
      <h1 className="mt-5 max-w-[18ch] text-[clamp(2rem,5vw,3.4rem)] leading-[1.12] font-bold">
        Get paid for every store you bring us.
      </h1>
      <p className="mt-5 max-w-[58ch] text-[17px] leading-[1.65] text-body-mute">
        You already decide which apps the stores you work with install. If
        Growsearch is one of them, this is where you see which stores took it,
        what they have earned you, and when it lands.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        {session ? (
          <Link href="/affiliates/dashboard" className="cta-primary">
            Open my dashboard
          </Link>
        ) : (
          <>
            <Link href="/affiliates/signup" className="cta-primary">
              Apply to join
            </Link>
            <Link href="/affiliates/login" className="cta-secondary">
              Sign in
            </Link>
          </>
        )}
      </div>

      <div className="mt-16 grid gap-5 lg:grid-cols-2">
        <article className="rounded-[16px] border border-brand/25 bg-cream p-7">
          <h2 className="font-poppins text-[13px] font-extrabold tracking-[0.05em] text-brand uppercase">
            Web-dev agencies
          </h2>
          <p className="mt-3 text-[clamp(1.5rem,3vw,2rem)] leading-tight font-bold">
            {formatRate(DEFAULT_RATE_BPS.agency)} of every payment, every month.
          </p>
          <p className="mt-4 text-[16px] leading-relaxed text-body-mute">
            You install Growsearch for a client and keep looking after it, so you
            keep earning from it — for as long as that store stays subscribed.
            One client on an annual plan is not a one-off cheque, it is a line
            in next year&apos;s revenue too.
          </p>
        </article>

        <article className="rounded-[16px] border border-line bg-white p-7">
          <h2 className="font-poppins text-[13px] font-extrabold tracking-[0.05em] text-brand uppercase">
            Creators and influencers
          </h2>
          <p className="mt-3 text-[clamp(1.5rem,3vw,2rem)] leading-tight font-bold">
            {formatRate(DEFAULT_RATE_BPS.influencer)} of the first payment.
          </p>
          <p className="mt-4 text-[16px] leading-relaxed text-body-mute">
            A higher share, paid once per store you bring. You made the
            introduction rather than the ongoing relationship, and this is the
            offer that reflects it — no ties, no reporting, no client work.
          </p>
        </article>
      </div>

      <section className="mt-16">
        <h2 className="text-[clamp(1.5rem,3.2vw,2.1rem)] leading-tight font-bold">
          How it works
        </h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: "Apply",
              body: "Tell us who you are and how you reach merchants. We read every application by hand.",
            },
            {
              step: "Get your code",
              body: "One short code, yours. It is in your dashboard the moment you are set up.",
            },
            {
              step: "It gets entered",
              body: "The merchant types it into Growsearch when they install it. That is the whole attribution — no cookies, no expiry window.",
            },
            {
              step: "You get paid",
              body: `Commission appears the day the store pays us, clears ${HOLD_DAYS} days later, and is paid out from your dashboard.`,
            },
          ].map((item, i) => (
            <li key={item.step} className="rounded-[14px] border border-line bg-white p-5">
              <span
                aria-hidden
                className="grid size-9 place-items-center rounded-full bg-peach font-poppins text-[15px] font-bold text-brand"
              >
                {i + 1}
              </span>
              <h3 className="mt-4 font-poppins text-[17px] font-bold">{item.step}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-body-mute">{item.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16 rounded-[16px] border border-line bg-cream p-7 sm:p-9">
        <h2 className="text-[clamp(1.4rem,3vw,1.9rem)] leading-tight font-bold">
          The small print, in plain words
        </h2>
        <dl className="mt-6 grid gap-6 sm:grid-cols-2">
          {[
            [
              "A store belongs to whoever got there first.",
              "The first code entered on a store wins, permanently. Nobody can take a client off you by talking the merchant into retyping a field.",
            ],
            [
              `Commission clears after ${HOLD_DAYS} days.`,
              "That is the window in which a payment can still be refunded. We would rather wait than ask for money back.",
            ],
            [
              "Refunds reverse the commission.",
              "Visibly, on the row it came from — never by quietly shrinking your balance. Anything already paid out to you stays paid out.",
            ],
            [
              "You are paid in your currency.",
              "Commission is recorded in whatever the store was charged. You tell us where to send it and in what.",
            ],
          ].map(([term, detail]) => (
            <div key={term}>
              <dt className="font-poppins text-[16px] font-bold text-charcoal">{term}</dt>
              <dd className="mt-1.5 text-[15px] leading-relaxed text-body-mute">{detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      {!session && (
        <div className="mt-14 flex flex-wrap items-center gap-4">
          <Link href="/affiliates/signup" className="cta-primary">
            Apply to join
          </Link>
          <p className="text-[15px] text-body-mute">Two minutes, and a person reads it.</p>
        </div>
      )}
    </div>
  );
}
