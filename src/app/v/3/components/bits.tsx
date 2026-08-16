import Link from "next/link";
import styles from "../shopfront.module.css";

/* Small shared vocabulary for the Shopfront variant: buttons, signage, paper
   goods and the hand-drawn connectors. Kept in one file so the radii, borders
   and spring timings stay identical everywhere they show up. */

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ff5c1a]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff4ec]";

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

/* Hand-drawn dotted connector. `variant` picks one of the two curves used on
   the page; the dash draws itself in when the parent Reveal fires. */
export function DottedArrow({
  className,
  variant = "right",
}: {
  className?: string;
  variant?: "right" | "down";
}) {
  const path =
    variant === "right"
      ? "M2 26C34 4 74 4 106 22"
      : "M18 2C4 22 12 42 30 52";
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
        strokeWidth="2.4"
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

/* The striped awning band. Used full-bleed as a section divider and, at a
   smaller scale, as the canopy over each shopfront. */
export function AwningBand({
  className,
  deep = false,
}: {
  className?: string;
  deep?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={`${deep ? styles.awningDeep : styles.awning} ${styles.scallop} ${
        deep ? styles.scallopDeep : ""
      } ${className ?? ""}`}
    />
  );
}

/* Punched price tag, used for section numbers and the pricing-ish chips. */
export function PriceTag({
  children,
  className,
  tone = "orange",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "orange" | "cream" | "butter";
}) {
  const tones = {
    orange: "bg-[#ff5c1a] text-white",
    cream: "bg-[#fffaf6] text-[#2b1c14] ring-1 ring-[#2b1c14]/12",
    butter: "bg-[#ffcf6b] text-[#2b1c14]",
  } as const;

  return (
    <span
      className={`relative inline-flex items-center gap-2 rounded-[10px] rounded-l-[4px] py-1.5 pr-4 pl-6 text-[13px] font-bold tracking-wide ${tones[tone]} ${className ?? ""}`}
      style={{
        clipPath:
          "polygon(10px 0, 100% 0, 100% 100%, 10px 100%, 0 50%)",
      }}
    >
      <span
        aria-hidden
        className="absolute top-1/2 left-2.5 size-1.5 -translate-y-1/2 rounded-full bg-current opacity-45"
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
      <p
        className={`${styles.hand} text-[26px] leading-none text-[#eb5213]`}
      >
        {eyebrow}
      </p>
      <h2
        className={`${styles.display} mt-3 text-[clamp(2rem,4.6vw,3.25rem)] leading-[1.03] font-extrabold text-balance`}
      >
        {title}
      </h2>
      {lead ? (
        <p
          className={`mt-5 text-[clamp(1.0625rem,1.35vw,1.1875rem)] leading-relaxed text-[#5a4034] ${
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

export function PrimaryButton({
  href,
  children,
  className,
  size = "md",
}: ButtonProps) {
  return (
    <Link
      href={href}
      className={`${styles.springy} ${styles.display} ${focusRing} group inline-flex items-center gap-2.5 rounded-full bg-[#ff5c1a] font-bold text-white shadow-[0_12px_26px_-12px_rgba(235,82,19,0.9)] hover:bg-[#eb5213] hover:shadow-[0_18px_34px_-12px_rgba(235,82,19,0.95)] ${
        size === "lg"
          ? "px-8 py-4 text-[19px]"
          : "px-6 py-3 text-[16px]"
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
      className={`${styles.springy} ${styles.display} ${focusRing} inline-flex items-center gap-2.5 rounded-full border-2 border-[#2b1c14]/85 bg-[#fffaf6] font-bold text-[#2b1c14] hover:bg-[#ffe8df] ${
        size === "lg"
          ? "px-8 py-[14px] text-[19px]"
          : "px-6 py-[10px] text-[16px]"
      } ${className ?? ""}`}
    >
      {children}
    </Link>
  );
}
