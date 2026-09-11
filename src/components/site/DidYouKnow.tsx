import Reveal from "./Reveal";

export default function DidYouKnow() {
  return (
    <section className="mx-auto max-w-[1370px] px-6 pt-24">
      <Reveal className="rounded-[28px] bg-peach px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
        <p className="font-poppins text-sm font-bold tracking-[0.18em] text-brand uppercase">Did you know?</p>
        <h2 className="mt-4 max-w-[900px] text-[clamp(2.2rem,5vw,4.75rem)] leading-[1.03] font-extrabold tracking-[-0.04em] text-charcoal">
          Shoppers who use search convert 2–3x more often than those who don&apos;t.
        </h2>
        <p className="mt-5 max-w-[860px] text-[clamp(1.1rem,1.8vw,1.45rem)] leading-relaxed text-body-mute">
          Most Shopify search bars weren&apos;t built to earn that conversion. Growsearch is.
        </p>
      </Reveal>
    </section>
  );
}
