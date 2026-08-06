import { clsx } from "@/lib/clsx";

/**
 * Growmerce mark — an open "G" ring with a growth arrow breaking out through
 * the gap.
 *
 * PLACEHOLDER: traced by eye from the supplied brand sheet so the page has a
 * correct-looking lockup today. Drop the official SVG into
 * `public/brand/growmerce.svg` and swap `<Mark />` for it before launch; the
 * wordmark below already matches the real lockup.
 */
function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="presentation">
      <path
        d="M61.63 18.05 A 34 34 0 1 0 82.85 41.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="19"
        strokeLinecap="butt"
      />
      <g fill="#ef6c25">
        <rect x="33" y="53" width="7" height="13" rx="1" />
        <rect x="42.5" y="47" width="7" height="19" rx="1" />
        <rect x="52" y="41" width="7" height="25" rx="1" />
        <path d="M84 16 L84 44 L57 44 Z" />
      </g>
    </svg>
  );
}

export default function Logo({
  variant = "inline",
  className,
}: {
  variant?: "inline" | "stacked";
  className?: string;
}) {
  if (variant === "stacked") {
    return (
      <span className={clsx("inline-flex flex-col items-center gap-2", className)}>
        <Mark className="h-14 w-14 text-ink-soft" />
        <span className="text-2xl tracking-tight text-ink">
          <b className="font-semibold">Grow</b>
          <span className="font-normal">merce</span>
        </span>
      </span>
    );
  }

  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      <Mark className="h-8 w-8 text-ink-soft" />
      <span className="text-2xl leading-none tracking-tight">
        <b className="font-bold text-brand">Grow</b>
        <span className="font-medium text-ink-soft">Merce</span>
      </span>
    </span>
  );
}
