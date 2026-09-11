import Link from "next/link";
import Arrow from "./Arrow";

/* The capture band from Figma: we do the first hour of work before the call. */
export default function ProveItBand({ className }: { className?: string }) {
  return (
    <section
      aria-labelledby="prove-it-title"
      className={`mx-auto max-w-[1370px] px-6 py-16 lg:py-20 ${className ?? ""}`}
    >
      <div className="rounded-[36px] bg-cream px-7 py-10 sm:px-12 sm:py-14 lg:px-20 lg:py-16">
        <p className="font-poppins text-[13px] font-bold tracking-[0.18em] text-brand uppercase">
          Before we ever talk
        </p>
        <div className="mt-5 grid items-end gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-14">
          <div>
            <h2
              id="prove-it-title"
              className="max-w-[18ch] text-[clamp(2.2rem,4.6vw,4.25rem)] leading-[1.02] font-extrabold tracking-tight text-balance"
            >
              Skip the call. We&rsquo;ll do the first hour of work
            </h2>
            <p className="mt-7 max-w-[52ch] text-[clamp(1rem,1.4vw,1.375rem)] leading-relaxed text-body-mute">
              Drop your store URL. We&rsquo;ll run your current search and send back
              your top zero-result queries, what they&rsquo;re costing you, and
              exactly how Growsearch would fix each one.
            </p>
          </div>

          <Link
            href="/try"
            className="cta-primary w-full sm:w-fit lg:mb-1 lg:justify-self-end"
          >
            Try it free
            <Arrow className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
