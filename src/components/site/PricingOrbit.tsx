import Image from "next/image";

/* The Figma ships this as one flat PNG: three arcs with icon discs sitting on
   them. Fitting circles to that artwork puts every disc within 11px of an arc
   at ~2.5px rms, so the arcs are redrawn here as real geometry and the discs
   cut out of the bitmap — which is what lets them travel along it.
   Coordinates stay in the artwork's own 1774x887 space. */
const W = 1774;
const H = 887;

/**
 * `window` is how much of each circle the band actually shows, measured by
 * walking the circle and testing the viewBox. It decides how many discs an arc
 * needs: space them further apart than the window and the arc goes empty for
 * part of every revolution.
 *
 * `speed` is shared, in artwork px per second, so a disc on the outer ring
 * moves at the same pace as one on the inner ring rather than the inner ones
 * whipping round. Period falls out of the circumference.
 */
const SPEED = 60;
const PER_ARC = 4;

const ARCS = [
  // window 74°–196°; four discs 90° apart keep one or two of them in it
  { cx: 1651.8, cy: 122.9, r: 757.2, phase: 145, icons: ["search", "voice", "mobile", "crm"] },
  // window 86°–184°
  { cx: 1816.3, cy: -38.1, r: 694.1, phase: 140, icons: ["video", "crm", "search", "voice"] },
  // window 80°–186°
  { cx: 1792.5, cy: -52.3, r: 383.5, phase: 185, icons: ["mobile", "search", "video", "crm"] },
] as const;

const DISC = 176;
const pc = (v: number, of: number) => `${((v / of) * 100).toFixed(4)}%`;
const cqw = (v: number) => `${((v / W) * 100).toFixed(4)}cqw`;

/**
 * The connected-icon web on the pricing band, revolving.
 *
 * Each disc hangs off a zero-size arm pinned at its arc's centre: the arm turns
 * a full circle, carrying the disc with it, and the disc counter-rotates at the
 * same rate so it stays the right way up. That is the whole trick — no path
 * maths at runtime, and the travel is exactly circular because it is a rotation
 * rather than an approximation of one.
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
          <circle key={a.r} cx={a.cx} cy={a.cy} r={a.r} stroke="#fff" strokeWidth="17" />
        ))}
      </svg>

      {ARCS.flatMap((arc) => {
        const period = ((2 * Math.PI * arc.r) / SPEED).toFixed(1);
        return arc.icons.map((icon, i) => (
          <span
            key={`${arc.r}-${i}`}
            className="orbit-arm"
            style={
              {
                left: pc(arc.cx, W),
                top: pc(arc.cy, H),
                "--r": cqw(arc.r),
                "--a": `${arc.phase + (i * 360) / PER_ARC}deg`,
                "--dur": `${period}s`,
              } as React.CSSProperties
            }
          >
            <Image
              src={`/img/pages/pricing-orbit/${icon}.webp`}
              alt=""
              width={DISC}
              height={DISC}
              className="orbit-disc"
              style={{ width: cqw(DISC), height: "auto" }}
            />
          </span>
        ));
      })}
    </div>
  );
}
