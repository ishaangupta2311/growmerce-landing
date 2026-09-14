import Reveal from "./Reveal";

export default function DidYouKnow() {
  return (
    <section className="mx-auto max-w-[1370px] px-6 pt-24">
      <Reveal className="rounded-[28px] bg-peach px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
        <p className="section-eyebrow">Did you know?</p>
        <h2 className="section-display mt-4 max-w-[18ch]">
          Shoppers who use search convert 2–3x more often than those who don&apos;t.
        </h2>
        <p className="section-lede mt-5 max-w-[60ch]">
          Most Shopify search bars weren&apos;t built to earn that conversion. Growsearch is.
        </p>
      </Reveal>
    </section>
  );
}
