import Image from "next/image";
import Link from "next/link";
import styles from "../nightmarket.module.css";

/* Shared vocabulary for the Night Market: signage, buttons, lightboxes and the
   hand-drawn connectors. Kept in one place so radii, glow strength and spring
   timings stay identical everywhere they appear. */

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ffc46b]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1d130c]";

export function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 23 23" fill="none" aria-hidden className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.0184 7.97819L11.4999 0L7.98131 7.97819L0 11.4968L7.98131 15.0153L11.4999 22.9977L15.0184 15.0153L22.9998 11.4968L15.0184 7.97819Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ChunkyArrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
      strokeWidth="2.6"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

/* Hand-drawn connector, drawn here as a dotted run of light between two
   points. Draws itself in when the parent Reveal fires. */
export function DottedArrow({
  className,
  variant = "right",
}: {
  className?: string;
  variant?: "right" | "down";
}) {
  const path =
    variant === "right" ? "M2 26C34 4 74 4 106 22" : "M18 2C4 22 12 42 30 52";
  const head =
    variant === "right"
      ? "M96 12c6 4 10 7 12 11-5 2-9 4-13 8"
      : "M20 38c2 7 5 11 10 14-1-6-1-10 1-15";

  return (
    <svg
      viewBox={variant === "right" ? "0 0 116 40" : "0 0 44 62"}
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d={path}
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeDasharray="1 9"
        className={styles.drawPath}
      />
      <path
        d={head}
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/* The striped awning, half in shadow with its scalloped fringe catching the
   light from the shop below. */
export function AwningBand({
  className,
  tone = "lit",
}: {
  className?: string;
  /** `lit` over dark surfaces, `ink` over the vermilion panel, `deep` for the
   *  units with nobody in them. */
  tone?: "lit" | "ink" | "deep";
}) {
  const tones = { lit: "", ink: styles.awningInk, deep: styles.awningDeep };
  return (
    <div
      aria-hidden
      className={`${styles.awning} ${tones[tone]} ${className ?? ""}`}
    />
  );
}

/* The wordmark lives in a backlit sign box at night — a cream acrylic face
   with the logo on it, which is exactly how a real shop sign works and keeps
   the brand colours untouched. */
export function Lightbox({
  className,
  imgClassName,
  priority = false,
}: {
  className?: string;
  imgClassName?: string;
  priority?: boolean;
}) {
  return (
    <span
      className={`relative inline-flex items-center rounded-[12px] bg-[#fff3e6] px-3 py-1.5 shadow-[0_0_24px_-4px_rgba(255,180,110,0.55),0_10px_22px_-14px_rgba(0,0,0,0.9)] ring-1 ring-[#ffc46b]/40 ${className ?? ""}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-1 top-0.5 h-1/3 rounded-t-[9px] bg-gradient-to-b from-white/70 to-transparent"
      />
      <Image
        src="/brand/logo.svg"
        alt="Growmerce"
        width={305}
        height={66}
        priority={priority}
        className={`relative h-7 w-auto sm:h-8 ${imgClassName ?? ""}`}
      />
    </span>
  );
}

/* Little illuminated tag used for section numbers and unit numbers. */
export function BulbTag({
  children,
  className,
  tone = "amber",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "amber" | "orange" | "dim";
}) {
  const tones = {
    amber:
      "bg-[#3a2415] text-[#ffc46b] ring-1 ring-[#ffc46b]/35 shadow-[0_0_18px_-6px_rgba(255,196,107,0.7)]",
    orange:
      "bg-[#ff5c1a] text-[#20140c] ring-1 ring-[#ffb27a]/60 shadow-[0_0_22px_-6px_rgba(255,92,26,0.9)]",
    dim: "bg-[#2a1b12] text-[#bda28c] ring-1 ring-[#ffc46b]/15",
  } as const;

  return (
    <span
      className={`${styles.sign} inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[14px] leading-none ${tones[tone]} ${className ?? ""}`}
    >
      <span
        aria-hidden
        className={`${styles.bulb} size-1.5 rounded-full`}
        style={{ animationDelay: "0.8s" }}
      />
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  className,
  align = "left",
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      className={`${align === "center" ? "mx-auto text-center" : ""} max-w-2xl ${className ?? ""}`}
    >
      <p className={`${styles.hand} text-[26px] leading-none text-[#ffc46b]`}>
        {eyebrow}
      </p>
      <h2
        className={`${styles.display} mt-3 text-[clamp(2rem,4.6vw,3.25rem)] leading-[1.03] font-extrabold text-balance text-[#fff2e4]`}
      >
        {title}
      </h2>
      {lead ? (
        <p
          className={`mt-5 text-[clamp(1.0625rem,1.35vw,1.1875rem)] leading-relaxed text-[#e3cab4] ${
            align === "center" ? "mx-auto" : ""
          }`}
        >
          {lead}
        </p>
      ) : null}
    </div>
  );
}

type ButtonProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  size?: "md" | "lg";
};

/* Bright orange with deep-brown lettering: the lit-sign look, and the only
   pairing on that orange that clears AA at button sizes. */
export function PrimaryButton({
  href,
  children,
  className,
  size = "md",
}: ButtonProps) {
  return (
    <Link
      href={href}
      className={`${styles.springy} ${styles.display} ${focusRing} group inline-flex items-center gap-2.5 rounded-full bg-[#ff5c1a] font-bold text-[#20140c] shadow-[0_0_28px_-4px_rgba(255,92,26,0.75),0_16px_30px_-16px_rgba(0,0,0,0.95)] hover:bg-[#ff7a33] hover:shadow-[0_0_44px_-4px_rgba(255,122,51,0.95),0_20px_36px_-16px_rgba(0,0,0,0.95)] ${
        size === "lg" ? "px-8 py-4 text-[19px]" : "px-6 py-3 text-[16px]"
      } ${className ?? ""}`}
    >
      {children}
      <ChunkyArrow className="size-[18px] transition-transform duration-300 ease-out group-hover:translate-x-1" />
    </Link>
  );
}

export function SecondaryButton({
  href,
  children,
  className,
  size = "md",
}: ButtonProps) {
  return (
    <Link
      href={href}
      className={`${styles.springy} ${styles.tube} ${styles.display} ${focusRing} inline-flex items-center gap-2.5 rounded-full bg-[#2b1c13]/60 font-bold text-[#fff2e4] hover:bg-[#3a2415] ${
        size === "lg" ? "px-8 py-[14px] text-[19px]" : "px-6 py-[10px] text-[16px]"
      } ${className ?? ""}`}
    >
      {children}
    </Link>
  );
}
