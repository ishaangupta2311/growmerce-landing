import Link from "next/link";

export default function CtaPair({
  primaryHref,
  primaryLabel = "GET STARTED",
  secondaryHref,
  secondaryLabel,
  className,
}: {
  primaryHref: string;
  primaryLabel?: string;
  secondaryHref: string;
  secondaryLabel: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-4 ${className ?? ""}`}>
      <Link
        href={primaryHref}
        className="inline-flex items-center justify-center rounded-full bg-brand px-9 py-4 font-poppins text-[clamp(1rem,1.5vw,1.375rem)] font-bold tracking-wide text-white shadow-[0_14px_30px_-14px_rgba(255,90,31,0.95)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_38px_-14px_rgba(255,90,31,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {primaryLabel}
      </Link>
      <Link
        href={secondaryHref}
        className="inline-flex items-center justify-center rounded-full border-2 border-charcoal px-9 py-4 font-poppins text-[clamp(1rem,1.5vw,1.375rem)] font-semibold tracking-wide text-charcoal transition-[transform,background-color,color] duration-200 hover:-translate-y-0.5 hover:bg-charcoal hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {secondaryLabel}
      </Link>
    </div>
  );
}
