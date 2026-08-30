import type { CSSProperties } from "react";

/**
 * The Growmerce thesis in one loop: a tool docks into the store you already
 * run, the catalogue starts working, the revenue line draws itself — and the
 * next slot stays deliberately unnamed.
 *
 * Purely decorative: the convictions list beside it is the readable form, so
 * this is aria-hidden. Every resting style below is the *finished* frame, and
 * the keyframes are gated on prefers-reduced-motion, so a reader who opts out
 * of motion still sees a complete picture rather than an empty one.
 */

/* Six catalogue tiles; the small stagger keeps them from lighting as one block
   without drifting the loop out of sync with the rest of the timeline. */
const TILES = [0, 90, 180, 60, 150, 240];

export default function ToolDock() {
  return (
    <div aria-hidden className="hidden w-full max-w-[460px] lg:block">
      <div className="rounded-[24px] border border-white/30 bg-white/10 p-4 shadow-[0_40px_90px_-50px_rgba(0,0,0,0.55)]">
        {/* Browser chrome — "the store you already run", untouched. */}
        <div className="flex items-center gap-2 px-1 pb-3.5">
          <span className="size-2 rounded-full bg-white/45" />
          <span className="size-2 rounded-full bg-white/45" />
          <span className="size-2 rounded-full bg-white/45" />
          <span className="ml-2 font-poppins text-[10px] font-bold tracking-[0.18em] text-white/60 uppercase">
            Your store
          </span>
        </div>

        {/* The dock: an empty socket until a tool slides into it. */}
        <div className="relative h-[48px]">
          <span className="dock-socket absolute inset-0 grid place-items-center rounded-full border border-dashed border-white/45 font-poppins text-[10px] font-bold tracking-[0.18em] text-white/65 uppercase">
            One tool at a time
          </span>
          <span className="dock-chip absolute inset-0 flex items-center gap-2.5 rounded-full bg-white px-4 shadow-[0_18px_34px_-18px_rgba(0,0,0,0.5)]">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="shrink-0 text-brand">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
              <path d="m20 20-3.8-3.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            <span className="font-poppins text-[13px] font-bold text-charcoal">
              Growsearch
            </span>
            <span className="ml-auto font-poppins text-[9px] font-bold tracking-[0.16em] text-brand uppercase">
              Installed
            </span>
          </span>
        </div>

        {/* The catalogue underneath, coming alive once the tool is in. */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {TILES.map((delay, i) => (
            <span
              key={i}
              className="dock-tile flex h-[54px] flex-col justify-between rounded-[10px] bg-white/45 p-2"
              style={{ "--d": `${delay}ms` } as CSSProperties}
            >
              <span className="h-[22px] rounded-[5px] bg-white/60" />
              <span className="h-[5px] w-2/3 rounded-full bg-white/60" />
            </span>
          ))}
        </div>

        {/* Judged on revenue, not on vibes. */}
        <div className="mt-4 flex items-center gap-3 rounded-[16px] bg-white/12 px-3.5 py-3">
          <svg width="104" height="32" viewBox="0 0 104 32" fill="none" className="shrink-0">
            <polyline
              className="dock-spark"
              points="2,28 22,23 42,25 62,15 82,11 102,3"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="140"
            />
          </svg>
          <span className="dock-metric text-[12px] leading-snug text-white/85">
            Search-attributed
            <br />
            revenue, in your numbers
          </span>
        </div>
      </div>

      {/* The roadmap promise, kept honest: no name on the empty socket. */}
      <div className="dock-pending mt-3 flex items-center gap-2.5 rounded-full border border-dashed border-white/40 px-4 py-2.5">
        <span className="size-2 rounded-full bg-white/55" />
        <span className="text-[12px] text-white/80">
          The next tool gets a name when it has customers
        </span>
      </div>
    </div>
  );
}
