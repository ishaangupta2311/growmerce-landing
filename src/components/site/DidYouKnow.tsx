import Image from "next/image";
import Reveal from "./Reveal";

export default function DidYouKnow() {
  return (
    <section className="mx-auto max-w-[1370px] px-6 pt-24">
      <Reveal className="grid items-center gap-8 rounded-[28px] bg-peach px-6 py-10 sm:px-10 sm:py-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12 lg:px-14 lg:py-14">
        <div>
          <p className="section-eyebrow">Did you know?</p>
          <h2 className="section-display mt-4 max-w-[18ch]">
            Shoppers who use search convert <span className="whitespace-nowrap">2–3x</span> more
            often than those who don&apos;t.
          </h2>
          <p className="section-lede mt-5 max-w-[60ch]">
            Most Shopify search bars weren&apos;t built to earn that conversion. Growsearch is.
          </p>
        </div>

        <Image
          src="/img/search-no-match.png"
          alt="A store search for “running shoes for gym under $100” returning “No exact matches found” and 0 results."
          width={1309}
          height={780}
          sizes="(min-width: 1370px) 580px, (min-width: 1024px) 44vw, 92vw"
          className="mx-auto h-auto w-full max-w-[560px]"
        />
      </Reveal>
    </section>
  );
}
