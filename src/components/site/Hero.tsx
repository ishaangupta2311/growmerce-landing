import Image from "next/image";
import Link from "next/link";

function HeroHeading({ className }: { className?: string }) {
  return (
    <h1
      className={`font-poppins font-medium leading-[1.12] text-[clamp(2rem,3.95vw,3.55rem)] ${className ?? ""}`}
    >
      Shopping, made Smarter
      <br />
      <span className="text-brand-bright">for every customer</span>
    </h1>
  );
}

function HeroCopy({ className }: { className?: string }) {
  return (
    <div className={className}>
      <p className="max-w-[600px] text-[clamp(1.125rem,1.6vw,1.5rem)] leading-snug text-body-mute">
        Growmerce turns browsing into buying with AI-powered personalization
        built for modern commerce.
      </p>
      <div className="mt-6 flex items-center gap-4">
        <Link href="#demo" className="pill-cta-white">
          Get a demo
        </Link>
        <Link href="#trial" className="pill-cta-outline">
          Try it free
        </Link>
      </div>
    </div>
  );
}

/* Crisp, hand-built stand-ins for the flattened UI bits baked into the old
   (520px…) Figma collage: a live search bar, a product-feed card and an
   order-confirmed chip, all floating over the dark bokeh panels. */

function SearchPill({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-full bg-white/95 py-3 pr-4 pl-5 shadow-[0_18px_50px_rgba(0,0,0,0.45)] ${className ?? ""}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="10.5" cy="10.5" r="6.5" stroke="#eb5213" strokeWidth="2.4" />
        <path d="m15.5 15.5 5 5" stroke="#eb5213" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <span className="text-sm font-medium text-black/70">
        white sneakers under ₹3,000
      </span>
      <span className="h-4 w-0.5 animate-caret bg-brand" aria-hidden />
    </div>
  );
}

function ProductCard({ className }: { className?: string }) {
  return (
    <div
      className={`w-44 rounded-2xl bg-white/95 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.45)] ${className ?? ""}`}
    >
      <p className="text-[11px] font-extrabold tracking-wide text-black/80 uppercase">
        Top match
      </p>
      {[92, 87, 81].map((match, i) => (
        <div key={match} className="mt-2.5 flex items-center gap-2.5">
          <span
            className={`size-8 shrink-0 rounded-lg ${
              ["bg-peach", "bg-brand-bright/30", "bg-logobar/60"][i]
            }`}
          />
          <span className="min-w-0 flex-1">
            <span className="block h-1.5 w-full rounded-full bg-black/10" />
            <span className="mt-1.5 block h-1.5 w-2/3 rounded-full bg-black/10" />
          </span>
          <span className="text-[10px] font-bold text-brand">{match}%</span>
        </div>
      ))}
    </div>
  );
}

function OrderChip({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-full bg-white/95 py-2.5 pr-5 pl-3 shadow-[0_18px_50px_rgba(0,0,0,0.45)] ${className ?? ""}`}
    >
      <span className="flex size-7 items-center justify-center rounded-full bg-brand-bright">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="m4 12.5 5.5 5.5L20 6.5" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="text-sm font-bold text-black/80">Order confirmed</span>
    </div>
  );
}

/* Dark bokeh panel backgrounds, drawn with layered radial gradients so they
   stay tack-sharp at any size. */
const BOKEH_BG: React.CSSProperties = {
  backgroundImage: [
    "radial-gradient(90px 90px at 78% 18%, rgba(255,146,72,0.5), transparent 70%)",
    "radial-gradient(60px 60px at 22% 40%, rgba(255,92,26,0.42), transparent 70%)",
    "radial-gradient(46px 46px at 60% 74%, rgba(255,210,150,0.32), transparent 70%)",
    "radial-gradient(120px 120px at 8% 85%, rgba(255,120,60,0.25), transparent 70%)",
    "linear-gradient(140deg, #241610 0%, #140d09 55%, #0b0705 100%)",
  ].join(", "),
};

const DOTS_BG: React.CSSProperties = {
  backgroundImage:
    "radial-gradient(rgba(255,140,80,0.55) 1.2px, transparent 1.4px)",
  backgroundSize: "14px 14px",
};

export default function Hero() {
  return (
    <section className="relative mx-auto max-w-[1440px]">
      {/* Warm ambient glow behind the composition. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 -z-10 h-[460px] w-[48%] rounded-full bg-brand-bright/[0.06] blur-[120px]"
      />

      {/* Desktop: stepped-panel collage rebuilt in code — photo left, dark
          bokeh panels stepping down to the right, crisp floating UI. */}
      <div className="relative hidden aspect-[1440/900] lg:block">
        <HeroHeading className="hero-enter absolute top-[8%] left-[46%] w-[54%] text-center [animation-delay:150ms]" />

        {/* Dark panels (base layer of the blob). */}
        <div
          className="hero-enter-scale absolute top-[32%] left-[45.2%] h-[60%] w-[30.8%] rounded-[48px] [animation-delay:250ms]"
          style={BOKEH_BG}
        />
        <div
          className="hero-enter-scale absolute top-[50%] left-[62%] h-[48%] w-[34.4%] rounded-[48px] [animation-delay:350ms]"
          style={BOKEH_BG}
        >
          <div className="absolute inset-6 rounded-[32px] opacity-60" style={DOTS_BG} />
          {/* faint product thumbnails strip, echoing the reference dashboard */}
          <div className="absolute bottom-8 left-8 flex gap-2.5">
            {["bg-peach/80", "bg-white/85", "bg-brand-bright/60", "bg-white/60"].map(
              (c, i) => (
                <span key={i} className={`h-12 w-10 rounded-md ${c}`} />
              ),
            )}
          </div>
        </div>

        {/* Photo panel (sits above the dark panels). */}
        <div className="hero-enter-scale absolute top-[4%] left-[3.6%] h-[70%] w-[42%] overflow-hidden rounded-[48px] [animation-delay:100ms]">
          <Image
            src="/img/hero-shopper.jpg"
            alt="A shopper smiling under warm street lights in the city at dusk"
            fill
            priority
            sizes="(min-width: 1024px) 42vw"
            className="object-cover"
          />
          {/* warm grade so the photo sits in the brand palette */}
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-bright/15 via-transparent to-transparent" />
        </div>

        {/* Floating UI elements. */}
        <SearchPill className="hero-enter absolute top-[38%] left-[46%] z-10 [animation-delay:600ms]" />
        <ProductCard className="hero-enter absolute top-[50%] left-[48.5%] z-10 animate-float-slow [animation-delay:750ms]" />
        <OrderChip className="hero-enter absolute top-[60%] left-[67%] z-10 animate-float [animation-delay:900ms]" />
        <Image
          src="/img/hero-cart.png"
          alt=""
          width={474}
          height={468}
          className="hero-enter absolute top-[27%] left-[78%] z-10 w-[18%] animate-float [animation-delay:450ms]"
        />

        <HeroCopy className="hero-enter absolute top-[78%] left-[5.5%] w-[36%] [animation-delay:500ms]" />
      </div>

      {/* Mobile / tablet: stacked flow with a compact composition. */}
      <div className="px-6 pt-10 lg:hidden">
        <HeroHeading className="hero-enter text-center [animation-delay:100ms]" />
        <div className="hero-enter-scale relative mt-8 [animation-delay:250ms]">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[36px] sm:aspect-[16/11]">
            <Image
              src="/img/hero-shopper.jpg"
              alt="A shopper smiling under warm street lights in the city at dusk"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-bright/15 via-transparent to-transparent" />
          </div>
          <SearchPill className="absolute -bottom-5 left-1/2 w-max max-w-[90%] -translate-x-1/2" />
        </div>
        <HeroCopy className="hero-enter mt-12 [animation-delay:400ms]" />
      </div>
    </section>
  );
}
