import styles from "../nightmarket.module.css";

/* ---------------------------------------------------------------------------
   Scenery — the set pieces of the night street. All of it is decorative, so
   every export is aria-hidden and carries no meaning that isn't also written
   in text somewhere nearby.
--------------------------------------------------------------------------- */

/* --------------------------------------------------------------------------
   String lights
   The wire is a run of quadratic swags stretched to the container width; the
   bulbs are real elements positioned on the exact same curve, so they stay
   round at any width (y = top + 4·sag·t(1−t) is the quadratic's own y).
-------------------------------------------------------------------------- */

const WIRE_TOP = 6;

function swagGeometry(swags: number, height: number) {
  const sag = height * 0.37;
  const control = WIRE_TOP + 2 * sag;

  let d = `M0 ${WIRE_TOP}`;
  for (let s = 0; s < swags; s++) {
    const x1 = ((s + 1) / swags) * 300;
    const xc = ((s + 0.5) / swags) * 300;
    d += ` Q${xc.toFixed(2)} ${control.toFixed(2)} ${x1.toFixed(2)} ${WIRE_TOP}`;
  }

  const bulbs: { x: number; y: number; i: number }[] = [];
  const per = 7;
  for (let s = 0; s < swags; s++) {
    for (let k = 1; k <= per; k++) {
      const t = k / (per + 1);
      bulbs.push({
        x: ((s + t) / swags) * 100,
        y: WIRE_TOP + 4 * sag * t * (1 - t),
        i: s * per + k,
      });
    }
  }

  return { d, bulbs };
}

export function StringLights({
  className,
  swags = 3,
  height = 92,
}: {
  className?: string;
  swags?: number;
  height?: number;
}) {
  const { d, bulbs } = swagGeometry(swags, height);

  return (
    <div
      aria-hidden
      className={`pointer-events-none ${styles.sway} ${className ?? ""}`}
      style={{ height }}
    >
      <div className="relative h-full w-full">
        <svg
          viewBox={`0 0 300 ${height}`}
          preserveAspectRatio="none"
          fill="none"
          className="absolute inset-0 h-full w-full"
        >
          <path
            d={d}
            stroke="#6b4a30"
            strokeWidth="1.6"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {bulbs.map((b) => (
          <span
            key={`${b.i}-${b.x.toFixed(2)}`}
            className="absolute -translate-x-1/2"
            style={{ left: `${b.x}%`, top: `${b.y}px` }}
          >
            <span className="mx-auto block h-[4px] w-[5px] rounded-[1px] bg-[#7d5836]" />
            <span
              className={`${styles.bulb} block size-[9px] rounded-full`}
              style={{ animationDelay: `${(b.i % 7) * 0.55}s` }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Rooftops
-------------------------------------------------------------------------- */

const GROUND = 220;

const BUILDINGS: { x: number; w: number; h: number; pitch?: boolean }[] = [
  { x: 0, w: 104, h: 116 },
  { x: 104, w: 72, h: 84 },
  { x: 176, w: 86, h: 142, pitch: true },
  { x: 262, w: 64, h: 96 },
  { x: 326, w: 92, h: 158 },
  { x: 418, w: 58, h: 120 },
  { x: 476, w: 110, h: 88 },
  { x: 586, w: 74, h: 168, pitch: true },
  { x: 660, w: 96, h: 104 },
  { x: 756, w: 68, h: 138 },
  { x: 824, w: 104, h: 92 },
  { x: 928, w: 80, h: 150 },
  { x: 1008, w: 62, h: 110 },
  { x: 1070, w: 130, h: 128 },
];

/* Windows someone left on. Sparse on purpose — a street at 11pm, not an
   office block. */
const WINDOWS: { x: number; y: number; w?: number; h?: number; o: number }[] = [
  { x: 22, y: 122, o: 0.8 },
  { x: 60, y: 140, o: 0.45 },
  { x: 128, y: 154, o: 0.6 },
  { x: 206, y: 116, o: 0.85 },
  { x: 236, y: 150, o: 0.4 },
  { x: 344, y: 84, o: 0.7 },
  { x: 386, y: 122, o: 0.5 },
  { x: 500, y: 156, o: 0.75 },
  { x: 604, y: 84, o: 0.9 },
  { x: 632, y: 128, o: 0.42 },
  { x: 700, y: 140, o: 0.62 },
  { x: 780, y: 110, o: 0.8 },
  { x: 856, y: 152, o: 0.5 },
  { x: 948, y: 96, o: 0.72 },
  { x: 1030, y: 132, o: 0.55 },
  { x: 1108, y: 116, o: 0.85 },
  { x: 1150, y: 150, o: 0.4 },
];

const TWINKLERS = new Set([3, 8, 11, 15]);

function skylinePath() {
  let d = `M0 ${GROUND}`;
  for (const b of BUILDINGS) {
    const top = GROUND - b.h;
    if (b.pitch) {
      d += ` L${b.x} ${top + 24} L${b.x + b.w / 2} ${top} L${b.x + b.w} ${top + 24}`;
    } else {
      d += ` L${b.x} ${top} L${b.x + b.w} ${top}`;
    }
  }
  d += ` L1200 ${GROUND} Z`;
  return d;
}

export function Skyline({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox={`0 0 1200 ${GROUND}`}
      preserveAspectRatio="none"
      fill="none"
      className={className}
    >
      <path d={skylinePath()} fill="#0a0603" />
      {/* chimneys, a water tank and an aerial, in the same silhouette */}
      <path d="M40 104 h13 v22 h-13 z" fill="#0a0603" />
      <path d="M300 62 h11 v22 h-11 z" fill="#0a0603" />
      <path d="M868 128 h12 v20 h-12 z" fill="#0a0603" />
      <path
        d="M770 82 h40 v10 h-40 z M776 92 h6 v10 h-6 z M798 92 h6 v10 h-6 z"
        fill="#0a0603"
      />
      <path
        d="M950 70 v-24 M942 52 l8 -6 8 6"
        stroke="#0a0603"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* rooftop rim-light where the town glow catches the parapets */}
      <path
        d={skylinePath()}
        fill="none"
        stroke="rgba(255,150,80,0.22)"
        strokeWidth="1.4"
      />
      {WINDOWS.map((w, i) => (
        <rect
          key={i}
          x={w.x}
          y={w.y}
          width={w.w ?? 7}
          height={w.h ?? 10}
          rx="1"
          fill="#ffc46b"
          opacity={w.o}
          className={TWINKLERS.has(i) ? styles.winLit : undefined}
          style={
            TWINKLERS.has(i) ? { animationDelay: `${i * 0.9}s` } : undefined
          }
        />
      ))}
    </svg>
  );
}

/* --------------------------------------------------------------------------
   Lamppost — pole, arm, lantern, and the cone of light it throws.
-------------------------------------------------------------------------- */

export function Lamppost({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none aspect-[13/42] ${className ?? ""}`}
    >
      <div className="relative h-full w-full">
        <svg viewBox="0 0 130 420" fill="none" className="h-full w-full">
          {/* plinth + pole */}
          <path d="M48 420 L53 398 L77 398 L82 420 Z" fill="#2a1d14" />
          <path d="M56 400 L56 96 L74 96 L74 400 Z" fill="#33241a" />
          <path d="M56 400 L56 96 L61 96 L61 400 Z" fill="#4a3524" />
          <path d="M52 392 h26 v8 h-26 z" fill="#2a1d14" />
          {/* arm */}
          <path
            d="M65 100 C65 64 78 46 102 46"
            stroke="#33241a"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path
            d="M65 100 C65 64 78 46 102 46"
            stroke="#543c28"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* lantern */}
          <g className={styles.lamphead}>
            <path d="M92 30 h22 l4 10 h-30 z" fill="#33241a" />
            <path d="M88 40 h30 l-7 30 h-16 z" fill="#ffcf8a" />
            <path
              d="M88 40 h30 l-7 30 h-16 z"
              fill="none"
              stroke="#5b4028"
              strokeWidth="2.5"
            />
            <ellipse cx="103" cy="70" rx="10" ry="3" fill="#ffe3b8" />
          </g>
        </svg>

        {/* the cone, anchored under the lantern (x = 103/130 of the drawing) */}
        <div
          className={`${styles.cone} absolute top-[11%] left-[79%] h-[95%] w-[430%] -translate-x-1/2`}
        />
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Ambient life: a few slow fireflies and one shooting star per half-minute.
-------------------------------------------------------------------------- */

const FIREFLIES = [
  { left: "8%", top: "62%", size: 7, delay: 0, dur: 17 },
  { left: "21%", top: "78%", size: 5, delay: 4.5, dur: 20 },
  { left: "34%", top: "48%", size: 6, delay: 9, dur: 16 },
  { left: "47%", top: "72%", size: 4, delay: 2.5, dur: 22 },
  { left: "61%", top: "58%", size: 7, delay: 12, dur: 18 },
  { left: "73%", top: "80%", size: 5, delay: 6.5, dur: 21 },
  { left: "86%", top: "54%", size: 6, delay: 14.5, dur: 19 },
  { left: "93%", top: "74%", size: 4, delay: 10.5, dur: 23 },
];

export function Fireflies({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
    >
      {FIREFLIES.map((f, i) => (
        <span
          key={i}
          className={`${styles.firefly} absolute rounded-full`}
          style={{
            left: f.left,
            top: f.top,
            width: f.size,
            height: f.size,
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.dur}s`,
          }}
        />
      ))}
    </div>
  );
}

export function ShootingStar({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`${styles.shootingStar} pointer-events-none absolute h-[2px] w-[130px] rounded-full ${className ?? ""}`}
    />
  );
}

/* --------------------------------------------------------------------------
   Marquee bulb frame — a border of bulbs chasing once around the perimeter.
-------------------------------------------------------------------------- */

const ACROSS = 15;
const DOWN = 5;
const PERIMETER = ACROSS * 2 + DOWN * 2;
const CHASE = 3.6;

export function BulbFrame({ className }: { className?: string }) {
  const across = Array.from({ length: ACROSS }, (_, i) => i);
  const down = Array.from({ length: DOWN }, (_, i) => i);

  const bulb = (key: string, style: React.CSSProperties, order: number) => (
    <span
      key={key}
      className={`${styles.chase} absolute size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full`}
      style={{ ...style, animationDelay: `${(order / PERIMETER) * CHASE}s` }}
    />
  );

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className ?? ""}`}
    >
      {across.map((i) =>
        bulb(`t${i}`, { left: `${((i + 0.5) / ACROSS) * 100}%`, top: 0 }, i),
      )}
      {down.map((i) =>
        bulb(
          `r${i}`,
          { left: "100%", top: `${((i + 0.5) / DOWN) * 100}%` },
          ACROSS + i,
        ),
      )}
      {across.map((i) =>
        bulb(
          `b${i}`,
          { left: `${((ACROSS - i - 0.5) / ACROSS) * 100}%`, top: "100%" },
          ACROSS + DOWN + i,
        ),
      )}
      {down.map((i) =>
        bulb(
          `l${i}`,
          { left: 0, top: `${((DOWN - i - 0.5) / DOWN) * 100}%` },
          ACROSS * 2 + DOWN + i,
        ),
      )}
    </div>
  );
}

/* --------------------------------------------------------------------------
   A neon plate hanging off a bracket.
-------------------------------------------------------------------------- */

export function NeonPlate({
  children,
  className,
  flicker = false,
}: {
  children: React.ReactNode;
  className?: string;
  flicker?: boolean;
}) {
  return (
    <div className={`${styles.hang} ${className ?? ""}`}>
      <div aria-hidden className="mx-auto flex w-[62%] justify-between">
        <span className={`${styles.strap} h-4 w-[3px] rounded-full`} />
        <span className={`${styles.strap} h-4 w-[3px] rounded-full`} />
      </div>
      <div
        className={`${styles.tube} rounded-[16px] bg-[#20140c]/85 px-5 py-2.5 backdrop-blur-[2px]`}
      >
        <span
          className={`${styles.sign} ${styles.neon} ${flicker ? styles.flicker : ""} block text-center text-[22px] leading-none sm:text-[26px]`}
        >
          {children}
        </span>
      </div>
    </div>
  );
}
