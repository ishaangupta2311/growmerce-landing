import Image from "next/image";
import Link from "next/link";

/* Decorative market chart from the Figma hero card, drawn as SVG so it stays
   crisp. Candles alternate charcoal/orange over peach gridlines. */
function CandleChart({ className }: { className?: string }) {
  const candles = [
    { x: 16, open: 112, close: 150, low: 158, high: 96, up: false },
    { x: 52, open: 84, close: 128, low: 140, high: 70, up: false },
    { x: 88, open: 82, close: 126, low: 138, high: 68, up: false },
    { x: 124, open: 44, close: 92, low: 104, high: 30, up: true },
    { x: 160, open: 24, close: 66, low: 78, high: 12, up: false },
    { x: 196, open: 62, close: 104, low: 116, high: 50, up: false },
    { x: 232, open: 34, close: 74, low: 86, high: 22, up: true },
    { x: 268, open: 70, close: 118, low: 130, high: 58, up: true },
    { x: 304, open: 30, close: 78, low: 92, high: 18, up: true },
  ];
  return (
    <svg viewBox="0 0 336 180" fill="none" aria-hidden className={className}>
      {[24, 60, 96, 132, 168].map((y) => (
        <line key={y} x1="4" x2="332" y1={y} y2={y} stroke="#FFD6C2" strokeWidth="1.5" />
      ))}
      {candles.map((c) => (
        <g key={c.x} stroke={c.up ? "#FF5A1F" : "#171717"} fill={c.up ? "#FF5A1F" : "#171717"}>
          <line x1={c.x + 10} x2={c.x + 10} y1={c.high} y2={c.low} strokeWidth="2.5" />
          <rect x={c.x} y={c.open} width="20" height={Math.max(6, c.close - c.open)} rx="2.5" />
        </g>
      ))}
    </svg>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-10 pb-10 lg:pt-4 lg:pb-6">
      <div className="mx-auto w-full max-w-[1370px] px-6">
        {/* Desktop: an absolutely-composed stage so the offset blocks, the
            full-bleed photo and the chart card land exactly where Figma puts
            them (frame 1459x812 below the nav; every value below is that
            frame's own percentage). */}
        <div className="relative hidden aspect-[1459/812] w-full lg:block">
          {/* The photo is a wide composition that bleeds off the left edge. */}
          <Image
            src="/img/pages/hero-shopping-desk.png"
            alt="A shopping trolley of parcels on a desk beside a laptop showing an online store"
            width={1474}
            height={737}
            priority
            sizes="(min-width: 1024px) 101vw, 100vw"
            className="hero-enter-scale absolute h-auto"
            style={{ left: "-6.51%", top: "18.74%", width: "101.03%", animationDelay: "150ms" }}
          />

          {/* Chart card */}
          <div
            className="hero-enter-scale absolute rounded-[10px] bg-[#fae2d2] p-4"
            style={{ left: "72.52%", top: "11.33%", width: "24.88%", height: "34.71%", animationDelay: "230ms" }}
          >
            <CandleChart className="h-full w-full" />
          </div>

          {/* The three orange blocks */}
          <h1 className="contents font-poppins font-extrabold tracking-[-0.02em] text-white">
            {[
              { text: "The high street of", left: "2.19%", top: "10.34%", width: "67.92%", radius: "rounded-tl-[14px] rounded-tr-[14px] rounded-bl-[14px]", delay: 0 },
              { text: "AI tools for", left: "25.36%", top: "30.79%", width: "44.76%", radius: "rounded-bl-[14px]", delay: 90 },
              { text: "ecommerce.", left: "45.39%", top: "50.37%", width: "52.01%", radius: "rounded-tr-[14px] rounded-br-[14px] rounded-bl-[14px]", delay: 180 },
            ].map((b) => (
              <span
                key={b.text}
                className={`hero-enter absolute flex items-center bg-brand px-6 text-[clamp(2rem,6.2vw,5.63rem)] leading-none ${b.radius}`}
                style={{ left: b.left, top: b.top, width: b.width, height: "20.44%", animationDelay: `${b.delay}ms` }}
              >
                {b.text}
              </span>
            ))}
          </h1>

          {/* Subtext + CTAs */}
          <p
            className="hero-enter absolute text-[clamp(1rem,1.65vw,1.5rem)] leading-snug text-body-mute"
            style={{ left: "46.76%", top: "70.94%", width: "51.19%", animationDelay: "300ms" }}
          >
            Growmerce turns search into sales by understanding what shoppers
            actually ask for.
          </p>

          <div
            className="hero-enter absolute flex items-center gap-4"
            style={{ left: "46.76%", top: "87.07%", animationDelay: "380ms" }}
          >
            <Link
              href="#demo"
              className="cta-primary"
            >
              See demo
            </Link>
            <Link
              href="#trial"
              className="cta-secondary"
            >
              Try it free
            </Link>
          </div>
        </div>

        {/* Mobile / tablet: stacked blocks, photo below, chart last. */}
        <div className="lg:hidden">
          <h1 className="font-poppins font-bold tracking-[-0.02em] text-white">
            {["The high street of", "AI tools for", "ecommerce."].map((line, i) => (
              <span
                key={line}
                className={`hero-enter block w-fit bg-brand px-4 pt-2 pb-3 text-[clamp(2.15rem,8.6vw,3.4rem)] leading-[1.02] ${i > 0 ? "mt-2" : ""} ${i === 1 ? "ml-6" : ""}`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {line}
              </span>
            ))}
          </h1>

          <p className="hero-enter mt-6 text-[clamp(1.0625rem,4.4vw,1.25rem)] leading-snug text-body-mute" style={{ animationDelay: "300ms" }}>
            Growmerce turns search into sales by understanding what shoppers
            actually ask for.
          </p>

          <div className="hero-enter mt-6 flex flex-wrap gap-3" style={{ animationDelay: "360ms" }}>
            <Link href="#demo" className="cta-primary">
              See demo
            </Link>
            <Link href="#trial" className="cta-secondary">
              Try it free
            </Link>
          </div>

          <Image
            src="/img/pages/hero-shopping-desk.png"
            alt="A shopping trolley of parcels on a desk beside a laptop showing an online store"
            width={1474}
            height={737}
            sizes="100vw"
            className="hero-enter-scale mt-8 h-auto w-full rounded-[10px]"
            style={{ animationDelay: "200ms" }}
          />

          <div className="mt-4 rounded-[20px] bg-peach/60 p-4">
            <CandleChart className="h-auto w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
