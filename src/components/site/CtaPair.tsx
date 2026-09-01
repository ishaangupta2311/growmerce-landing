import Link from "next/link";

export default function CtaPair({
  primaryHref,
  primaryLabel = "Get started",
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
    /* The pair wraps on every phone. Left at their own widths the two stacked
       buttons read as a mistake, so below 430px they take the column instead —
       which also makes the primary action a full-width target. */
    <div
      className={`flex flex-wrap items-center gap-4 [&>a]:max-[430px]:w-full ${className ?? ""}`}
    >
      <Link
        href={primaryHref}
        className="cta-primary"
      >
        {primaryLabel}
      </Link>
      <Link
        href={secondaryHref}
        className="cta-secondary"
      >
        {secondaryLabel}
      </Link>
    </div>
  );
}
