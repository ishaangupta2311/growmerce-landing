import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { clsx } from "@/lib/clsx";

/**
 * A small preview of a post or library image. Library images go through the
 * Next.js optimiser so a 40px thumbnail does not download a 2400px original;
 * a pasted external URL is shown as-is, since only our own paths are allowed
 * through the optimiser.
 */
export default function Thumb({
  src,
  alt = "",
  className,
  sizes = "64px",
}: {
  src: string | null;
  alt?: string;
  className?: string;
  sizes?: string;
}) {
  return (
    <span className={clsx("relative block overflow-hidden rounded-md bg-zinc-100", className)}>
      {!src ? (
        <span className="grid size-full place-items-center text-zinc-300">
          <ImageIcon className="size-1/2 max-h-6 max-w-6" />
        </span>
      ) : src.startsWith("/uploads/") ? (
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- external URLs are not allowed through the optimiser
        <img src={src} alt={alt} loading="lazy" className="size-full object-cover" />
      )}
    </span>
  );
}
