import Image from "next/image";

/* What "Why Growsearch?" shows on a phone, one per capability.
   ------------------------------------------------------------------
   From sm up each capability is a screenshot of a desktop storefront. On a
   phone that is either a thumbnail or a crop of its product grid, and the
   crop made all four tabs look the same.

   These are Growsearch itself on a phone: captures of the live widget at
   390px on our two demo stores, one screen per capability. Two stores on
   purpose, electronics and a general store, so the four screens are not four
   views of one catalogue. Each file is the top 780x1593 of the capture, which
   is what is left of an iPhone 16 Pro Max screen under its status bar.

   `bar` is the colour of that store's search header, which is what the
   capture opens on: the status bar takes it, as it would in the real browser,
   so the screen reads as one surface and not a white strip over a page. */
const SCREENS: Record<string, { file: string; bar: string; ink: string }> = {
  "intent-based-search": { file: "intent", bar: "#d9bc55", ink: "#2b1a12" },
  "zero-result-recovery": { file: "recovery", bar: "#dd3632", ink: "#ffffff" },
  "conversational-shopping": { file: "conversation", bar: "#dd3632", ink: "#ffffff" },
  "smart-suggestion": { file: "suggestions", bar: "#dfc157", ink: "#2b1a12" },
};

/* Natural titanium, lit from the upper left. */
const TITANIUM =
  "linear-gradient(140deg,#dedad1 0%,#9b978f 22%,#cfcbc2 48%,#87847d 74%,#c4c0b7 100%)";

function StatusBar({ bar, ink }: { bar: string; ink: string }) {
  return (
    <div
      className="flex h-[36px] items-center justify-between px-[24px] pt-[3px] font-poppins text-[11px] font-semibold transition-colors duration-300"
      style={{ backgroundColor: bar, color: ink }}
    >
      <span>9:41</span>
      <span className="flex items-center gap-[4px]">
        <svg width="13" height="9" viewBox="0 0 17 11" fill="currentColor">
          <rect x="0" y="7" width="3" height="4" rx="0.7" />
          <rect x="4.6" y="5" width="3" height="6" rx="0.7" />
          <rect x="9.2" y="2.5" width="3" height="8.5" rx="0.7" />
          <rect x="13.8" y="0" width="3" height="11" rx="0.7" />
        </svg>
        <svg width="12" height="9" viewBox="0 0 16 11.5" fill="currentColor">
          <path d="M8 2.3c2.3 0 4.4.9 6 2.4l1-1.1A10.2 10.2 0 0 0 8 .8C5.3.8 2.8 1.9 1 3.6l1 1.1a8.7 8.7 0 0 1 6-2.4Z" />
          <path d="M8 5.8c1.3 0 2.5.5 3.4 1.3l1.1-1.1A6.5 6.5 0 0 0 8 4.2c-1.7 0-3.3.7-4.5 1.8l1.1 1.1A5 5 0 0 1 8 5.8Z" />
          <path d="M10.3 8.2a3.3 3.3 0 0 0-4.6 0L8 10.7l2.3-2.5Z" />
        </svg>
        <svg width="21" height="10" viewBox="0 0 27 12" fill="none">
          <rect x="0.5" y="0.5" width="22" height="11" rx="3.2" stroke="currentColor" opacity="0.4" />
          <rect x="2" y="2" width="19" height="8" rx="1.9" fill="currentColor" />
          <path d="M24.5 4v4c.8-.3 1.5-1.1 1.5-2s-.7-1.7-1.5-2Z" fill="currentColor" opacity="0.45" />
        </svg>
      </span>
    </div>
  );
}

/**
 * An iPhone 16 Pro Max, whole: titanium band, the thin black border inside
 * it, Dynamic Island, the buttons on both rails including Camera Control, and
 * the capture filling the screen under a status bar.
 *
 * Only one screen is ever painted. The others are in the DOM so they are
 * already loaded when their turn comes, but hidden outright, and the one
 * coming in fades up from the blank screen. Two captures are never on screen
 * together, at any opacity: they are screens full of text, and one showing
 * through another reads as a rendering fault.
 *
 * Fixed at 270px. Every measurement inside is that width times the real
 * handset's proportions (77.6mm across, a 440x956pt screen), and a phone
 * drawn narrower than this stops being legible anyway.
 *
 * Decorative: the tab names the capability and the line under it describes it.
 */
export default function CapabilityPhones({ activeId, className }: { activeId: string; className?: string }) {
  const current = SCREENS[activeId] ?? Object.values(SCREENS)[0];
  const rail = "absolute w-[3px] bg-[#a5a199]";

  return (
    <div aria-hidden className={`relative mx-auto w-[270px] ${className ?? ""}`}>
      {/* Left rail: Action button, volume up, volume down. */}
      <span className={`${rail} top-[98px] -left-[2px] h-[20px] rounded-l-[2px]`} />
      <span className={`${rail} top-[136px] -left-[2px] h-[36px] rounded-l-[2px]`} />
      <span className={`${rail} top-[182px] -left-[2px] h-[36px] rounded-l-[2px]`} />
      {/* Right rail: side button, then Camera Control lower down. */}
      <span className={`${rail} top-[158px] -right-[2px] h-[58px] rounded-r-[2px]`} />
      <span className={`${rail} top-[330px] -right-[1px] h-[38px] rounded-r-[2px] opacity-70`} />

      <div
        className="relative rounded-[47px] p-[3px] shadow-[0_44px_60px_-34px_rgba(70,30,10,0.55),0_0_0_0.5px_rgba(0,0,0,0.25)]"
        style={{ backgroundImage: TITANIUM }}
      >
        <div className="rounded-[44px] bg-black p-[4px]">
          <div className="relative overflow-hidden rounded-[40px] bg-white">
            <StatusBar bar={current.bar} ink={current.ink} />
            <span className="absolute top-[8px] left-1/2 h-[21px] w-[73px] -translate-x-1/2 rounded-full bg-black" />
            <div className="relative aspect-[440/894]">
              {Object.entries(SCREENS).map(([id, screen]) => {
                const active = id === activeId;
                return (
                  <Image
                    key={id}
                    src={`/img/demos/iphone/${screen.file}.webp`}
                    alt=""
                    width={780}
                    height={1593}
                    sizes="256px"
                    className="absolute inset-0 size-full object-cover object-top"
                    style={{
                      opacity: active ? 1 : 0,
                      visibility: active ? "visible" : "hidden",
                      transition: active ? "opacity 300ms ease-out" : "none",
                    }}
                  />
                );
              })}
            </div>
            {/* Home indicator. */}
            <span className="absolute bottom-[6px] left-1/2 h-[4px] w-[88px] -translate-x-1/2 rounded-full bg-black/80" />
          </div>
        </div>
      </div>
    </div>
  );
}
