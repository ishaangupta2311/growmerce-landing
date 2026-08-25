import Image from "next/image";

const PLATFORMS = [
  { name: "Shopify", src: "/img/logos/logo-shopify.svg", w: 261, h: 75, cls: "h-8 sm:h-10" },
  { name: "BigCommerce", src: "/img/logos/logo-bigcommerce.svg", w: 81, h: 81, cls: "h-9 sm:h-11" },
  { name: "WordPress", src: "/img/logos/logo-wordpress.svg", w: 85, h: 85, cls: "h-9 sm:h-11" },
  // Figma's woo artboard is a 259px square with the wordmark in a thin band;
  // this is that band trimmed to its ink bounds so it matches the others.
  { name: "WooCommerce", src: "/img/logos/logo-woocommerce.png", w: 777, h: 158, cls: "h-6 sm:h-8" },
];

/* The logo row itself. It sizes to its contents and keeps one even gap rather
   than stretching across the container — spreading four marks over a 1370px
   row leaves them looking unrelated. Every surface that shows the platforms
   in a line uses this, so the rhythm is fixed in one place. */
function PlatformLogos({ className }: { className?: string }) {
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-12 gap-y-6 sm:gap-x-16 ${className ?? ""}`}
    >
      {PLATFORMS.map((p) => (
        <Image
          key={p.name}
          src={p.src}
          alt={p.name}
          width={p.w}
          height={p.h}
          className={`w-auto object-contain ${p.cls}`}
        />
      ))}
    </div>
  );
}

/* Integration targets, never presented as customers. */
export default function PlatformStrip({
  label = "Works with",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <section
      aria-label={`${label} the platforms you already run`}
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

export { PLATFORMS, PlatformLogos };
