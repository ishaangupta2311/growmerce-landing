import Arrow from "@/components/site/Arrow";

/* The Figma's capture box, with its two fields made real: a plain GET to /try,
   which reads `store` and `email` and starts from there. No script needed,
   and /try keeps the one copy of the validation and the lead capture.

   The Figma's paragraph promises "the three workflows most likely costing you
   hours"; /try does not send that. It draws Growsearch on the visitor's own
   store, so this says so — the same promise the band made before. */
const FIELD =
  "h-12 w-full rounded-full border border-line bg-[#f3eeeb] px-5 text-[16px] text-charcoal placeholder:text-muted focus:border-brand focus:bg-white focus:outline-none";

export default function SkipTheCall() {
  return (
    <section aria-labelledby="skip-title" className="mx-auto max-w-[1370px] px-6 py-10">
      <div className="grid items-center gap-8 rounded-[30px] border-[3px] border-brand bg-cream px-7 py-9 sm:px-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,0.8fr)] lg:gap-14 lg:py-10">
        <div>
          <p className="text-[15px] font-bold tracking-[0.04em] text-charcoal uppercase">Before we ever talk</p>
          <h2
            id="skip-title"
            className="mt-2 text-[clamp(2rem,4.6vw,4.25rem)] leading-[1.05] font-extrabold tracking-tight text-brand text-balance"
          >
            Skip the call. We&rsquo;ll do the first hour of work
          </h2>
          <p className="mt-4 max-w-[52ch] text-[clamp(1rem,1.4vw,1.25rem)] leading-snug text-body-mute">
            We&rsquo;ll show you where your search is falling short. Drop your
            store URL and see your current results side by side with Growsearch.
          </p>
        </div>

        <form action="/try" method="get" className="flex flex-col gap-3.5">
          <label className="sr-only" htmlFor="skip-store">
            Store URL
          </label>
          <input id="skip-store" name="store" type="text" inputMode="url" autoComplete="url" required placeholder="yourstore.com" className={FIELD} />
          <label className="sr-only" htmlFor="skip-email">
            Work email
          </label>
          <input id="skip-email" name="email" type="email" autoComplete="email" required placeholder="you@yourstore.com" className={FIELD} />
          <button type="submit" className="cta-primary mt-1 w-full rounded-full">
            okay, prove it
            <Arrow className="size-4" />
          </button>
        </form>
      </div>
    </section>
  );
}
