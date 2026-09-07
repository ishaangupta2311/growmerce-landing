import Image from "next/image";

/* The Figma ships this as one flat PNG: three arcs with five icon discs sitting
   on them. Fitting circles to that artwork puts every disc within 11px of an
   arc at ~2.5px rms, so the arcs are redrawn here as real geometry and the
   discs cut out of the bitmap — which is what lets them travel along it.
   Coordinates stay in the artwork's own 1774x887 space. */
const W = 1774;
const H = 887;

const ARCS = [
  { cx: 1651.8, cy: 122.9, r: 757.2 },
  { cx: 1816.3, cy: -38.1, r: 694.1 },
  { cx: 1792.5, cy: -52.3, r: 383.5 },
] as const;

/* angle is where the Figma parks each disc, measured from its arc's centre;
   sweep is how far it drifts either side of that. Durations are deliberately
   coprime-ish so the five never fall into step. */
const ICONS = [
  { src: "search", alt: "", arc: 0, angle: 169.05, sweep: 5.5, dur: 21 },
  { src: "voice", alt: "", arc: 0, angle: 129.78, sweep: 6.5, dur: 26 },
  { src: "mobile", alt: "", arc: 1, angle: 145.12, sweep: 7, dur: 17 },
  { src: "crm", alt: "", arc: 1, angle: 104.69, sweep: 6, dur: 23 },
  { src: "video", alt: "", arc: 2, angle: 127.67, sweep: 9, dur: 15 },
] as const;

const DISC = 176;
const pc = (v: number, of: number) => `${((v / of) * 100).toFixed(4)}%`;
const cqw = (v: number) => `${((v / W) * 100).toFixed(4)}cqw`;

/**
 * The connected-icon web on the pricing band, with the discs drifting along
 * their arcs.
 *
 * Each disc hangs off a zero-size hub pinned at its arc's centre: the hub
 * rotates, which carries the disc around the circle, and the disc counter-
 * rotates by the same amount so it stays the right way up. That is the whole
 * trick — no path maths at runtime, and the motion is exactly circular because
 * it is a rotation rather than an approximation of one.
 *
 * The container is a size container so the radii can be written in cqw and the
 * whole web scales with the band instead of needing a fixed height.
 */
export default function PricingOrbit({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none @container absolute ${className ?? ""}`}
      style={{ aspectRatio: `${W} / ${H}` }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} fill="none" className="absolute inset-0 size-full">
        {/* Full circles: the viewBox clips each one to the sweep the artwork
            actually shows, so there is nothing to trim by hand. */}
        {ARCS.map((a) => (
          <circle
            key={a.r}
            cx={a.cx}
            cy={a.cy}
            r={a.r}
            stroke="#fff"
            strokeWidth="17"
          />
        ))}
      </svg>

      {ICONS.map((icon) => {
        const arc = ARCS[icon.arc];
        return (
          <span
            key={icon.src}
            className="orbit-arm"
            style={
              {
                left: pc(arc.cx, W),
                top: pc(arc.cy, H),
                "--r": cqw(arc.r),
                "--a": `${icon.angle}deg`,
                "--sweep": `${icon.sweep}deg`,
                "--dur": `${icon.dur}s`,
              } as React.CSSProperties
            }
          >
            <Image
              src={`/img/pages/pricing-orbit/${icon.src}.webp`}
              alt=""
              width={DISC}
              height={DISC}
              className="orbit-disc"
              style={{ width: cqw(DISC), height: "auto" }}
            />
          </span>
        );
      })}
    </div>
  );
}
