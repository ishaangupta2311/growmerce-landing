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
    <div className={`flex flex-wrap items-center gap-4 ${className ?? ""}`}>
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
