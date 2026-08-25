import Image from "next/image";

/* Only the Shopify app has shipped. The rest stay on the page as a roadmap,
   but nothing here should read as somewhere a merchant can install today, so
   `live` drives both the grey treatment and a status line everywhere the
   platform marks appear. */
const PLATFORMS = [
  { name: "Shopify", src: "/img/logos/logo-shopify.svg", w: 261, h: 75, cls: "h-8 sm:h-10", live: true },
  { name: "BigCommerce", src: "/img/logos/logo-bigcommerce.svg", w: 81, h: 81, cls: "h-9 sm:h-11", live: false },
  { name: "WordPress", src: "/img/logos/logo-wordpress.svg", w: 85, h: 85, cls: "h-9 sm:h-11", live: false },
  // Figma's woo artboard is a 259px square with the wordmark in a thin band;
  // this is that band trimmed to its ink bounds so it matches the others.
  { name: "WooCommerce", src: "/img/logos/logo-woocommerce.png", w: 777, h: 158, cls: "h-6 sm:h-8", live: false },
];

/* Greying a mark tells a sighted reader it is not ready; this says the same
   thing in text, so the distinction survives without colour. */
function PlatformStatus({ live, className }: { live: boolean; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-poppins text-[10px] font-semibold tracking-[0.1em] uppercase ${live ? "text-brand" : "text-charcoal/45"} ${className ?? ""}`}
    >
      <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${live ? "bg-brand" : "bg-charcoal/30"}`} />
      {live ? "Live" : "Coming soon"}
    </span>
  );
}

/* The logo row itself. It sizes to its contents and keeps one even gap rather
   than stretching across the container — spreading four marks over a 1370px
   row leaves them looking unrelated. Every surface that shows the platforms
   in a line uses this, so the rhythm is fixed in one place. */
function PlatformLogos({ className }: { className?: string }) {
  return (
    <div
      className={`flex flex-wrap items-start justify-center gap-x-12 gap-y-6 sm:gap-x-16 ${className ?? ""}`}
    >
      {PLATFORMS.map((p) => (
        <div key={p.name} className="flex flex-col items-center gap-2.5">
          {/* The marks are different heights; a common band keeps the status
              lines on one baseline instead of stepping with each logo. */}
          <span className="flex h-9 items-center sm:h-11">
            <Image
              src={p.src}
              alt={p.name}
              width={p.w}
              height={p.h}
              className={`w-auto object-contain ${p.cls} ${p.live ? "" : "opacity-45 grayscale"}`}
            />
          </span>
          <PlatformStatus live={p.live} />
        </div>
      ))}
    </div>
  );
}

/* Integration targets, never presented as customers. */
export default function PlatformStrip({
  label = "Available on",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <section
      aria-label={`${label} these platforms`}
      className={`bg-peach py-8 ${className ?? ""}`}
    >
      <div className="mx-auto flex max-w-[1370px] flex-col items-center justify-center gap-6 px-6 lg:flex-row lg:gap-14">
        <p className="shrink-0 font-poppins text-[13px] font-semibold tracking-[0.16em] text-charcoal/55 uppercase">
          {label}
        </p>
        <PlatformLogos />
      </div>
    </section>
  );
}

export { PLATFORMS, PlatformLogos, PlatformStatus };
