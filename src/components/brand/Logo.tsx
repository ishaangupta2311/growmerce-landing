import Image from "next/image";
import { clsx } from "@/lib/clsx";

/**
 * The official Growmerce lockup, from `public/brand/growmerce.svg`.
 *
 * NOTE: the supplied artwork is the square 400×400 stacked lockup (mark above
 * wordmark). It is used here at both sizes, which means the wordmark is small
 * in the nav. A horizontal lockup would sit much better in a 64px header —
 * worth exporting one if it exists.
 */
export default function Logo({
  variant = "inline",
  className,
}: {
  variant?: "inline" | "stacked";
  className?: string;
}) {
  const size = variant === "stacked" ? 88 : 52;

  return (
    <span className={clsx("inline-flex items-center", className)}>
      <Image
        src="/brand/growmerce.svg"
        alt="Growmerce"
        width={size}
        height={size}
        priority={variant === "inline"}
        className={variant === "stacked" ? "h-22 w-22" : "h-13 w-13"}
        style={{ height: size, width: size }}
      />
    </span>
  );
}
