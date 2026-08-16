import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import styles from "../bazaar.module.css";

/* The shared print vocabulary for the Sticker Bazaar: stickers, stamps, tape,
   barcodes, tags and buttons. Everything lives here so the keylines, shadow
   offsets and spring timings stay identical wherever they show up. */

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ff5c1a]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff6ee]";

/** Rest tilt for anything printed. Kept inside -6°…6° across the whole page. */
export const tilt = (deg: number) => ({ "--rot": `${deg}deg` }) as CSSProperties;

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
      strokeWidth="2.8"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

/** Hand-drawn dotted connector; the dash draws in with its Reveal wrapper. */
export function DottedArrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 116 40" fill="none" aria-hidden className={className}>
      <path
        d="M2 26C34 4 74 4 106 22"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeDasharray="1 9"
        className={styles.drawPath}
      />
      <path
        d="M96 12c6 4 10 7 12 11-5 2-9 4-13 8"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------
   Stickers
------------------------------------------------------------------------- */

type StickerProps = {
  children: ReactNode;
  className?: string;
  rot?: number;
  peel?: boolean;
  style?: CSSProperties;
};

/** Colour fill, white die-cut keyline, ink outline, printed offset shadow. */
export function Sticker({
  children,
  className,
  rot = 0,
  peel = false,
  style,
}: StickerProps) {
  return (
    <div
      className={`${styles.sticker} ${peel ? styles.peelCorner : ""} ${className ?? ""}`}
      style={{ ...tilt(rot), ...style }}
    >
      {children}
    </div>
  );
}

/** Die-cut starburst flash — the "NEW!" on the box. */
export function Starburst({
  children,
  className,
  fine = false,
  style,
}: {
  children: ReactNode;
  className?: string;
  fine?: boolean;
  style?: CSSProperties;
}) {
  return (
    <span
      className={`${fine ? styles.starburstFine : styles.starburst} grid place-items-center text-center ${className ?? ""}`}
      style={style}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------
   Tape
------------------------------------------------------------------------- */

/** A strip of packing tape. Multiplies over whatever it is holding down. */
export function Tape({
  className,
  kraft = false,
  style,
}: {
  className?: string;
  kraft?: boolean;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className={`${kraft ? styles.tapeKraft : styles.tape} block ${className ?? ""}`}
      style={style}
    />
  );
}

const RIBBON_TONES = {
  orange: "bg-[#d1400a] text-white",
  ink: "bg-[#2b1c14] text-[#ffe8df]",
  butter: "bg-[#ffd66e] text-[#2b1c14]",
  sky: "bg-[#8ed4e6] text-[#2b1c14]",
} as const;

/**
 * Full-bleed tape ribbon running along a section seam. Decorative: the words
 * repeat verbatim in the page copy, so it is hidden from assistive tech.
 */
export function TapeRibbon({
  items,
  tone = "orange",
  angle = -2,
  reverse = false,
  className,
}: {
  items: string[];
  tone?: keyof typeof RIBBON_TONES;
  angle?: number;
  reverse?: boolean;
  className?: string;
}) {
  const track = (
    <ul className="flex shrink-0 items-center">
      {items.map((item) => (
        <li
          key={item}
          className={`${styles.poster} flex items-center gap-4 px-5 text-[15px] whitespace-nowrap sm:text-[18px]`}
        >
          {item}
          <Sparkle className="size-2.5 shrink-0 opacity-70" />
        </li>
      ))}
    </ul>
  );

  return (
    <div
      aria-hidden
      className={`relative -ml-[4vw] w-[108vw] ${className ?? ""}`}
      style={{ transform: `rotate(${angle}deg)` }}
    >
      <div
        className={`overflow-hidden border-y-[3px] border-[#2b1c14] py-2 ${RIBBON_TONES[tone]} shadow-[0_10px_22px_-16px_rgba(96,44,14,0.9)]`}
      >
        <div
          className={`flex w-max animate-marquee ${reverse ? styles.reverse : ""}`}
        >
          {track}
          {track}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Print furniture: barcodes, stamps, tags
------------------------------------------------------------------------- */

/** Deterministic bar widths — same on the server and in the browser. */
function barWidths(seed: string, count: number) {
  let h = 2166136261;
  const out: number[] = [];
  for (let i = 0; i < count; i += 1) {
    h ^= seed.charCodeAt(i % seed.length) + i * 7;
    h = Math.imul(h, 16777619) >>> 0;
    out.push(1 + (h % 3));
  }
  return out;
}

/**
 * A barcode that draws itself once, when its section scrolls in. Purely
 * decorative — the number underneath is set as text for anyone reading it.
 */
export function Barcode({
  seed,
  className,
  bars = 40,
  color = "#2b1c14",
}: {
  seed: string;
  className?: string;
  bars?: number;
  color?: string;
}) {
  const widths = barWidths(seed, bars);
  return (
    <span
      aria-hidden
      className={`flex items-end gap-[2px] overflow-hidden ${className ?? ""}`}
    >
      {widths.map((w, i) => (
        <span
          key={i}
          className={`${styles.barcodeBar} block h-full shrink-0`}
          style={
            {
              width: `${w}px`,
              backgroundColor: color,
              opacity: i % 5 === 3 ? 0.55 : 1,
              "--i": i,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}

const STAMP_TONES = {
  orange: "text-[#d1400a]",
  ink: "text-[#2b1c14]",
  sky: "text-[#16697f]",
  butter: "text-[#ffd66e]",
} as const;

/**
 * A rubber stamp: distressed double rule, tilted, landing with a thunk when
 * its Reveal fires. `onDark` flips the ink from multiply to screen so it
 * lightens a dark panel instead of disappearing into it.
 */
export function Stamp({
  children,
  className,
  tone = "orange",
  rot = -8,
  onDark = false,
  size = "md",
}: {
  children: ReactNode;
  className?: string;
  tone?: keyof typeof STAMP_TONES;
  rot?: number;
  onDark?: boolean;
  size?: "md" | "lg";
}) {
  return (
    <span
      className={`${styles.stamp} ${styles.stampInk} ${styles.mono} ${
        onDark ? styles.stampLight : ""
      } ${STAMP_TONES[tone]} inline-block rounded-[7px] border-[3px] border-current p-[3px] ${className ?? ""}`}
      style={tilt(rot)}
    >
      <span
        className={`block rounded-[3px] border-2 border-current font-bold tracking-[0.2em] uppercase ${
          size === "lg"
            ? "px-6 py-3 text-[15px] sm:text-[17px]"
            : "px-3.5 py-1.5 text-[11.5px]"
        }`}
      >
        {children}
      </span>
    </span>
  );
}

/** Price-gun tag: notched corner, punched hole, hangs from a string. */
export function GunTag({
  children,
  className,
  tone = "butter",
}: {
  children: ReactNode;
  className?: string;
  tone?: "butter" | "cream" | "orange" | "sky";
}) {
  const tones = {
    butter: "bg-[#ffd66e] text-[#2b1c14]",
    cream: "bg-[#fffaf5] text-[#2b1c14]",
    orange: "bg-[#d1400a] text-white",
    sky: "bg-[#8ed4e6] text-[#2b1c14]",
  } as const;

  return (
    <span
      className={`${styles.gunTag} relative inline-block py-2 pr-4 pl-7 ${tones[tone]} ${className ?? ""}`}
    >
      <span
        aria-hidden
        className="absolute top-[13px] left-[9px] size-[7px] rounded-full bg-[#2b1c14]/45 ring-2 ring-white/60"
      />
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------
   Section furniture
------------------------------------------------------------------------- */

export function SectionHeading({
  eyebrow,
  title,
  lead,
  className,
  align = "left",
  eyebrowTone = "butter",
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  className?: string;
  align?: "left" | "center";
  eyebrowTone?: "butter" | "sky" | "peach" | "orange";
}) {
  const tones = {
    butter: "bg-[#ffd66e] text-[#2b1c14]",
    sky: "bg-[#8ed4e6] text-[#2b1c14]",
    peach: "bg-[#ffe8df] text-[#d1400a]",
    orange: "bg-[#d1400a] text-white",
  } as const;

  return (
    <div
      className={`${align === "center" ? "mx-auto text-center" : ""} max-w-2xl ${className ?? ""}`}
    >
      <span
        className={`${styles.mono} ${tones[eyebrowTone]} inline-block -rotate-[1.6deg] border-2 border-[#2b1c14] px-3 py-1 text-[11.5px] font-bold tracking-[0.2em] uppercase shadow-[3px_4px_0_rgba(96,44,14,0.3)]`}
      >
        {eyebrow}
      </span>
      <h2
        className={`${styles.display} mt-5 text-[clamp(2rem,4.6vw,3.25rem)] leading-[1.02] font-extrabold text-balance`}
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

/* -------------------------------------------------------------------------
   Buttons — printed slabs with an ink keyline and a hard offset shadow.
------------------------------------------------------------------------- */

type ButtonProps = {
  href: string;
  children: ReactNode;
  className?: string;
  size?: "md" | "lg";
};

const sizeClass = {
  md: "px-6 py-3 text-[16px]",
  lg: "px-7 py-3.5 text-[18px] sm:px-8 sm:py-4 sm:text-[19px]",
} as const;

/** Deep vermilion, not the brightest orange: white text has to clear AA. */
export function PrimaryButton({
  href,
  children,
  className,
  size = "md",
}: ButtonProps) {
  return (
    <Link
      href={href}
      className={`${styles.springy} ${styles.display} ${focusRing} group inline-flex items-center gap-2.5 rounded-[14px] border-[3px] border-[#2b1c14] bg-[#d1400a] font-extrabold text-white ${sizeClass[size]} ${className ?? ""}`}
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
      className={`${styles.springy} ${styles.display} ${focusRing} inline-flex items-center gap-2.5 rounded-[14px] border-[3px] border-[#2b1c14] bg-[#fffaf5] font-extrabold text-[#2b1c14] hover:bg-[#ffd66e] ${sizeClass[size]} ${className ?? ""}`}
    >
      {children}
    </Link>
  );
}
