import Image from "next/image";
import { clsx } from "@/lib/clsx";

/**
 * A post image. Library images (/uploads/…) are resized per device by the
 * Next.js optimiser; an external URL an editor pasted is shown as-is, since
 * the optimiser is deliberately not open to arbitrary hosts.
 */
export default function BlogImage({
  src,
  alt,
  sizes,
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  if (src.startsWith("/uploads/")) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={clsx("object-cover", className)} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- external URLs are not allowed through the optimiser
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      className={clsx("absolute inset-0 size-full object-cover", className)}
    />
  );
}
